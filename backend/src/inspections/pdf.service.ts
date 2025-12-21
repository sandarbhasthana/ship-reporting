import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import {
  InspectionStatus,
  InspectionReport,
  InspectionEntry,
  Vessel,
  Organization,
  User,
} from '@ship-reporting/prisma';
import * as path from 'path';
import * as fs from 'fs';
import { S3Service } from '../s3/s3.service';

// Type for the full inspection report with all relations
// Type for inspection entry with relations
type InspectionEntryWithRelations = InspectionEntry & {
  officeSignUser: User | null;
};

// Type for the full inspection report with all relations
type InspectionReportWithRelations = InspectionReport & {
  vessel: (Vessel & { organization: Organization | null }) | null;
  createdBy: User | null;
  entries: InspectionEntryWithRelations[];
};

// Column definition type
interface ColumnDefinition {
  header: string;
  width: number;
  key: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  // Font names (will be set to Roboto if available, otherwise Helvetica)
  private fontRegular = 'Helvetica';
  private fontBold = 'Helvetica-Bold';

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  /**
   * Resolve logo path - handles both local paths and S3 paths
   * For S3 paths (s3://...), returns null as we can't use them directly in PDFs
   * For local paths (/uploads/...), returns the full filesystem path
   */
  private resolveLocalLogoPath(logoPath: string): string | null {
    if (!logoPath) return null;

    // S3 paths can't be used directly in PDFs (would need to download first)
    if (logoPath.startsWith('s3://')) {
      this.logger.warn(
        'S3 logo paths are not yet supported in PDF generation. Logo will be skipped.',
      );
      return null;
    }

    // Local path - resolve to full filesystem path
    // Handle both /uploads/... and uploads/... formats
    const relativePath = logoPath.startsWith('/')
      ? logoPath.slice(1)
      : logoPath;
    return path.join(process.cwd(), relativePath);
  }

  private getFontPaths(): { regular: string; bold: string } {
    // Try multiple possible locations for fonts
    const possiblePaths = [
      path.join(__dirname, 'fonts'), // Compiled location
      path.join(__dirname, '..', 'inspections', 'fonts'), // Alternative compiled
      path.join(process.cwd(), 'src', 'inspections', 'fonts'), // Development
      path.join(process.cwd(), 'backend', 'src', 'inspections', 'fonts'), // Monorepo dev
    ];

    for (const fontPath of possiblePaths) {
      const regular = path.join(fontPath, 'Roboto-Regular.ttf');
      const bold = path.join(fontPath, 'Roboto-Bold.ttf');
      if (fs.existsSync(regular) && fs.existsSync(bold)) {
        return { regular, bold };
      }
    }

    return { regular: '', bold: '' };
  }

  private registerFonts(doc: PDFKit.PDFDocument): void {
    const fonts = this.getFontPaths();

    if (fonts.regular && fonts.bold) {
      try {
        doc.registerFont('Roboto', fonts.regular);
        doc.registerFont('Roboto-Bold', fonts.bold);
        this.fontRegular = 'Roboto';
        this.fontBold = 'Roboto-Bold';
      } catch {
        // Fall back to Helvetica if registration fails
        this.fontRegular = 'Helvetica';
        this.fontBold = 'Helvetica-Bold';
      }
    } else {
      // Fall back to Helvetica
      this.fontRegular = 'Helvetica';
      this.fontBold = 'Helvetica-Bold';
    }
  }

  async generateInspectionPdf(reportId: string): Promise<Buffer> {
    // Fetch the inspection report with all related data
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id: reportId },
      include: {
        vessel: {
          include: {
            organization: true,
          },
        },
        createdBy: true,
        entries: {
          include: {
            officeSignUser: true,
          },
          orderBy: { srNo: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      // Register Roboto fonts (falls back to Helvetica if not found)
      this.registerFonts(doc);

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate PDF content
      this.generatePdfContent(doc, report);

      doc.end();
    });
  }

  private generatePdfContent(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
  ): void {
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Draw header
    this.drawHeader(doc, report, pageWidth);

    // Draw table
    this.drawTable(doc, report, pageWidth);

    // Draw footer on all pages
    this.drawFooter(doc, report);
  }

  private drawFooter(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
  ): void {
    const org = report.vessel?.organization;
    const footerText = org?.footerText;

    if (!footerText) return;

    // Get total pages and iterate through each
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Position footer at bottom left of page (within margins)
      const footerY = doc.page.height - 25;

      doc
        .fontSize(8)
        .font(this.fontRegular)
        .fillColor('#666666')
        .text(footerText, doc.page.margins.left, footerY, {
          lineBreak: false,
          continued: false,
        });

      // Reset fill color
      doc.fillColor('#000000');
    }
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
    pageWidth: number,
  ): void {
    const org = report.vessel?.organization;
    const startX = doc.page.margins.left;
    let startY = doc.y;

    // ========== TOP HEADER BOX ==========
    const headerBoxHeight = 70;
    const leftColWidth = pageWidth * 0.55;
    const rightColWidth = pageWidth * 0.45;

    // Draw outer border
    doc.rect(startX, startY, pageWidth, headerBoxHeight).stroke();

    // Draw vertical divider
    doc
      .moveTo(startX + leftColWidth, startY)
      .lineTo(startX + leftColWidth, startY + headerBoxHeight)
      .stroke();

    // LEFT SIDE - Company name and form info
    // Try to add company logo
    let logoWidth = 0;
    if (org?.logo) {
      const logoPath = this.resolveLocalLogoPath(org.logo);
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, startX + 5, startY + 5, {
            width: 50,
            height: 50,
          });
          logoWidth = 55;
        } catch {
          // Logo failed to load
          this.logger.warn(`Failed to load logo from path: ${logoPath}`);
        }
      }
    }

    // Company name
    doc.fontSize(11).font(this.fontBold);
    doc.text(
      org?.name || 'SHIPPING COMPANY',
      startX + logoWidth + 10,
      startY + 10,
      {
        width: leftColWidth - logoWidth - 20,
        align: 'center',
      },
    );

    doc.fontSize(9).font(this.fontRegular);
    doc.text('FORM MANUAL', startX + logoWidth + 10, startY + 25, {
      width: leftColWidth - logoWidth - 20,
      align: 'center',
    });

    // Ship's File No and Office File No row - fixed position for left side
    const fileRowY = startY + 42;
    doc
      .moveTo(startX, fileRowY)
      .lineTo(startX + leftColWidth, fileRowY)
      .stroke();

    // Calculate the midpoint for file row divider
    const fileRowMidX = startX + leftColWidth / 2;

    doc.fontSize(8).font(this.fontBold);
    doc.text(`SHIP'S FILE NO: `, startX + 5, fileRowY + 8, { continued: true });
    doc
      .font(this.fontRegular)
      .text(report.shipFileNo || report.vessel?.shipFileNo || '-');

    doc
      .font(this.fontBold)
      .text(`OFFICE FILE NO: `, fileRowMidX + 5, fileRowY + 8, {
        continued: true,
      });
    doc.font(this.fontRegular).text(report.officeFileNo || '-');

    // Draw vertical divider in file row - aligned with the column divider
    doc
      .moveTo(fileRowMidX, fileRowY)
      .lineTo(fileRowMidX, startY + headerBoxHeight)
      .stroke();

    // RIGHT SIDE - Revision, Page, Form No, Date
    const rightStartX = startX + leftColWidth;
    const rightCellWidth = rightColWidth / 2;
    // Use same Y position as fileRowY for alignment
    const rightRowDividerY = fileRowY;
    const topCellHeight = rightRowDividerY - startY;
    const bottomCellHeight = startY + headerBoxHeight - rightRowDividerY;

    // Draw grid lines for right side - vertical divider
    doc
      .moveTo(rightStartX + rightCellWidth, startY)
      .lineTo(rightStartX + rightCellWidth, startY + headerBoxHeight)
      .stroke();
    // Horizontal divider aligned with left side
    doc
      .moveTo(rightStartX, rightRowDividerY)
      .lineTo(rightStartX + rightColWidth, rightRowDividerY)
      .stroke();

    // Top row text - vertically centered
    const topRowTextY = startY + (topCellHeight - 10) / 2 + 2;
    doc.fontSize(8).font(this.fontBold);
    doc.text(`REVISION# `, rightStartX + 5, topRowTextY, { continued: true });
    doc.font(this.fontRegular).text(report.revisionNo || '1');

    doc
      .font(this.fontBold)
      .text(`PAGE `, rightStartX + rightCellWidth + 5, topRowTextY, {
        continued: true,
      });
    doc.font(this.fontRegular).text('1/1'); // Will be updated by page numbers

    // Bottom row text - vertically centered
    const bottomRowTextY = rightRowDividerY + (bottomCellHeight - 10) / 2 + 2;
    doc.font(this.fontBold).text(`FORM NO: `, rightStartX + 5, bottomRowTextY, {
      continued: true,
    });
    doc.font(this.fontRegular).text(report.formNo || '-');

    const inspectionDate = report.inspectionDate
      ? new Date(report.inspectionDate).toLocaleDateString()
      : '-';
    doc
      .font(this.fontBold)
      .text(`DATE `, rightStartX + rightCellWidth + 5, bottomRowTextY, {
        continued: true,
      });
    doc.font(this.fontRegular).text(inspectionDate);

    startY += headerBoxHeight + 15;

    // ========== MAIN TITLE ==========
    doc.fontSize(12).font(this.fontBold);
    doc.text(report.title || 'THIRD PARTY DEFICIENCY SUMMARY', startX, startY, {
      width: pageWidth,
      align: 'center',
      underline: true,
    });

    startY += 25;

    // ========== VESSEL / INSPECTED BY / DATE ROW ==========
    doc.fontSize(9).font(this.fontBold);
    const thirdWidth = pageWidth / 3;

    doc.text('VESSEL: ', startX, startY, { continued: true });
    doc
      .font(this.fontRegular)
      .text(report.vessel?.name || '-', { underline: true });

    doc
      .font(this.fontBold)
      .text('INSPECTED BY: ', startX + thirdWidth, startY, { continued: true });
    doc
      .font(this.fontRegular)
      .text(report.inspectedBy || '-', { underline: true });

    doc
      .font(this.fontBold)
      .text('DATE: ', startX + thirdWidth * 2, startY, { continued: true });
    doc.font(this.fontRegular).text(inspectionDate, { underline: true });

    doc.y = startY + 25;
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
    pageWidth: number,
  ): void {
    const entries = report.entries;
    const startX = doc.page.margins.left;
    let startY = doc.y;

    // Column definitions (percentages of total width) - adjusted for better proportions
    const columns: ColumnDefinition[] = [
      { header: 'SR NO', width: 0.04, key: 'srNo' },
      { header: 'DEFICIENCY', width: 0.14, key: 'deficiency' },
      {
        header: "MASTER'S - CAUSE\nANALYSIS",
        width: 0.12,
        key: 'mastersCauseAnalysis',
      },
      { header: 'CORRECTIVE ACTION', width: 0.12, key: 'correctiveAction' },
      { header: 'PREVENTIVE ACTION', width: 0.12, key: 'preventiveAction' },
      { header: 'COMPL DATE', width: 0.08, key: 'completionDate' },
      { header: 'COMPANY ANALYSIS', width: 0.15, key: 'companyAnalysis' },
      { header: 'REMARKS*', width: 0.23, key: 'remarks' },
    ];

    const rowHeight = 20;
    const groupHeaderHeight = 18;
    const headerHeight = 35;
    const fontSize = 7;
    const padding = 4;

    // ========== GROUP HEADERS (SHIP STAFF / OFFICE) ==========
    // Calculate widths for group headers
    const shipStaffWidth = columns
      .slice(0, 6)
      .reduce((sum, col) => sum + pageWidth * col.width, 0);
    const officeWidth = columns
      .slice(6)
      .reduce((sum, col) => sum + pageWidth * col.width, 0);

    doc.fontSize(8).font(this.fontBold);

    // SHIP STAFF header
    doc.rect(startX, startY, shipStaffWidth, groupHeaderHeight).stroke();
    doc.text('SHIP STAFF', startX, startY + 4, {
      width: shipStaffWidth,
      align: 'center',
    });

    // OFFICE header
    doc
      .rect(startX + shipStaffWidth, startY, officeWidth, groupHeaderHeight)
      .stroke();
    doc.text('OFFICE', startX + shipStaffWidth, startY + 4, {
      width: officeWidth,
      align: 'center',
    });

    startY += groupHeaderHeight;

    // ========== COLUMN HEADERS ==========
    doc.fontSize(fontSize).font(this.fontBold);
    let x = startX;

    // First draw all header cell borders
    columns.forEach((col) => {
      const colWidth = pageWidth * col.width;
      doc.rect(x, startY, colWidth, headerHeight).stroke();
      x += colWidth;
    });

    // Then draw header text - vertically centered with clipping
    x = startX;
    columns.forEach((col) => {
      const colWidth = pageWidth * col.width;

      // Save state and clip to cell bounds
      doc.save();
      doc.rect(x + 1, startY + 1, colWidth - 2, headerHeight - 2).clip();

      // Calculate vertical center for header text
      const headerTextHeight = doc.heightOfString(col.header, {
        width: colWidth - padding * 2,
      });
      const headerVerticalOffset = (headerHeight - headerTextHeight) / 2;

      doc.text(col.header, x + padding, startY + headerVerticalOffset, {
        width: colWidth - padding * 2,
        align: 'center',
      });

      doc.restore();
      x += colWidth;
    });

    startY += headerHeight;
    doc.font(this.fontRegular).fontSize(fontSize);

    // Draw data rows
    entries.forEach((entry) => {
      // Calculate row height based on content
      const contentHeight = this.calculateRowHeight(
        doc,
        entry,
        columns,
        pageWidth,
        fontSize,
        padding,
      );
      const currentRowHeight = Math.max(rowHeight, contentHeight);

      // Check if we need a new page
      if (
        startY + currentRowHeight >
        doc.page.height - doc.page.margins.bottom - 30
      ) {
        doc.addPage();
        startY = doc.page.margins.top;

        // Redraw group headers on new page
        doc.fontSize(8).font(this.fontBold);

        // SHIP STAFF header
        doc.rect(startX, startY, shipStaffWidth, groupHeaderHeight).stroke();
        doc.text('SHIP STAFF', startX, startY + 4, {
          width: shipStaffWidth,
          align: 'center',
        });

        // OFFICE header
        doc
          .rect(startX + shipStaffWidth, startY, officeWidth, groupHeaderHeight)
          .stroke();
        doc.text('OFFICE', startX + shipStaffWidth, startY + 4, {
          width: officeWidth,
          align: 'center',
        });

        startY += groupHeaderHeight;

        // Redraw column headers on new page - first borders
        doc.fontSize(fontSize).font(this.fontBold);
        x = startX;

        columns.forEach((col) => {
          const colWidth = pageWidth * col.width;
          doc.rect(x, startY, colWidth, headerHeight).stroke();
          x += colWidth;
        });

        // Then header text - vertically centered with clipping
        x = startX;
        columns.forEach((col) => {
          const colWidth = pageWidth * col.width;

          // Save state and clip to cell bounds
          doc.save();
          doc.rect(x + 1, startY + 1, colWidth - 2, headerHeight - 2).clip();

          const headerTextHeight = doc.heightOfString(col.header, {
            width: colWidth - padding * 2,
          });
          const headerVerticalOffset = (headerHeight - headerTextHeight) / 2;

          doc.text(col.header, x + padding, startY + headerVerticalOffset, {
            width: colWidth - padding * 2,
            align: 'center',
          });

          doc.restore();
          x += colWidth;
        });

        startY += headerHeight;
        doc.font(this.fontRegular).fontSize(fontSize);
      }

      // Draw row - first draw all cell borders
      x = startX;
      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;
        doc.rect(x, startY, colWidth, currentRowHeight).stroke();
        x += colWidth;
      });

      // Then draw all cell content (vertically centered) with clipping
      x = startX;
      doc.font(this.fontRegular).fontSize(fontSize);
      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;

        let value = '';
        if (col.key === 'completionDate') {
          value = entry.completionDate
            ? new Date(entry.completionDate).toLocaleDateString()
            : '';
        } else if (col.key === 'remarks') {
          // Combine status, sign, and date
          const status = this.formatStatus(entry.status);
          const sign = entry.officeSignUser?.name || '';
          const date = entry.officeSignDate
            ? new Date(entry.officeSignDate).toLocaleDateString()
            : '';
          value = [status, sign, date].filter(Boolean).join('\n');
        } else {
          value = this.getEntryValue(entry, col.key);
        }

        if (value) {
          // Save state and clip to cell bounds
          doc.save();
          doc
            .rect(x + 1, startY + 1, colWidth - 2, currentRowHeight - 2)
            .clip();

          // Calculate vertical position for text
          const textHeight = doc.heightOfString(value, {
            width: colWidth - padding * 2,
          });
          const verticalOffset = Math.max(
            padding,
            (currentRowHeight - textHeight) / 2,
          );

          doc.text(value, x + padding, startY + verticalOffset, {
            width: colWidth - padding * 2,
            lineGap: 1,
          });

          // Restore state (removes clipping)
          doc.restore();
        }
        x += colWidth;
      });

      startY += currentRowHeight;
    });

    // If no entries, show empty message
    if (entries.length === 0) {
      doc.text('No entries found.', startX, startY + 10);
    }
  }

  private calculateRowHeight(
    doc: PDFKit.PDFDocument,
    entry: InspectionEntryWithRelations,
    columns: ColumnDefinition[],
    pageWidth: number,
    fontSize: number,
    padding: number,
  ): number {
    let maxHeight = 20;

    columns.forEach((col) => {
      const colWidth = pageWidth * col.width - padding * 2;
      let text = '';

      if (col.key === 'remarks') {
        const status = this.formatStatus(entry.status);
        const sign = entry.officeSignUser?.name || '';
        const date = entry.officeSignDate
          ? new Date(entry.officeSignDate).toLocaleDateString()
          : '';
        text = [status, sign, date].filter(Boolean).join('\n');
      } else if (col.key === 'completionDate') {
        text = entry.completionDate
          ? new Date(entry.completionDate).toLocaleDateString()
          : '';
      } else {
        text = this.getEntryValue(entry, col.key);
      }

      if (text) {
        doc.fontSize(fontSize);
        const textHeight = doc.heightOfString(text, {
          width: colWidth,
        });
        maxHeight = Math.max(maxHeight, textHeight + padding * 2);
      }
    });

    return Math.min(maxHeight, 100); // Cap max height
  }

  private getEntryValue(
    entry: InspectionEntryWithRelations,
    key: string,
  ): string {
    switch (key) {
      case 'srNo':
        return entry.srNo?.toString() || '';
      case 'deficiency':
        return entry.deficiency || '';
      case 'mastersCauseAnalysis':
        return entry.mastersCauseAnalysis || '';
      case 'correctiveAction':
        return entry.correctiveAction || '';
      case 'preventiveAction':
        return entry.preventiveAction || '';
      case 'companyAnalysis':
        return entry.companyAnalysis || '';
      default:
        return '';
    }
  }

  private formatStatus(status: InspectionStatus): string {
    switch (status) {
      case InspectionStatus.CLOSED_SATISFACTORILY:
        return 'Closed';
      case InspectionStatus.FURTHER_ACTION_NEEDED:
        return 'Action Needed';
      default:
        return 'Open';
    }
  }
}
