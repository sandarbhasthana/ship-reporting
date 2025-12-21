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

    // Pre-load signature images for all unique signers
    const signatureCache = await this.loadSignatureImages(report.entries);

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

      // Generate PDF content with signature cache
      this.generatePdfContent(doc, report, signatureCache);

      doc.end();
    });
  }

  /**
   * Load signature images for all unique signers in the entries
   * Returns a map of userId -> Buffer (image data)
   */
  private async loadSignatureImages(
    entries: InspectionEntryWithRelations[],
  ): Promise<Map<string, Buffer>> {
    const signatureCache = new Map<string, Buffer>();

    // Get unique signers with signature images
    const signersWithSignatures = entries
      .filter((entry) => entry.officeSignUser?.signatureImage)
      .map((entry) => ({
        userId: entry.officeSignUser!.id,
        signaturePath: entry.officeSignUser!.signatureImage!,
      }));

    // Deduplicate by userId
    const uniqueSigners = Array.from(
      new Map(signersWithSignatures.map((s) => [s.userId, s])).values(),
    );

    // Load each signature image
    for (const signer of uniqueSigners) {
      try {
        const imageBuffer = await this.loadImageFromPath(signer.signaturePath);
        if (imageBuffer) {
          signatureCache.set(signer.userId, imageBuffer);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to load signature for user ${signer.userId}: ${errorMessage}`,
        );
      }
    }

    return signatureCache;
  }

  /**
   * Load an image from either S3 or local filesystem
   */
  private async loadImageFromPath(imagePath: string): Promise<Buffer | null> {
    if (!imagePath) return null;

    // S3 path
    if (imagePath.startsWith('s3://')) {
      const s3Key = imagePath.replace('s3://', '');
      return this.s3Service.downloadFile(s3Key);
    }

    // Local path
    const localPath = this.resolveLocalLogoPath(imagePath);
    if (localPath && fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    return null;
  }

  private generatePdfContent(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
    signatureCache: Map<string, Buffer>,
  ): void {
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Draw header
    this.drawHeader(doc, report, pageWidth);

    // Draw table with signature images
    this.drawTable(doc, report, pageWidth, signatureCache);

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

    // ========== VESSEL / INSPECTION TYPE / DATE ROW ==========
    doc.fontSize(9).font(this.fontBold);
    const thirdWidth = pageWidth / 3;

    doc.text('VESSEL: ', startX, startY, { continued: true });
    doc
      .font(this.fontRegular)
      .text(report.vessel?.name || '-', { underline: true });

    // Inspection Type - center aligned
    const inspectionTypeLabel = 'INSPECTION TYPE: ';
    const inspectionTypeValue = report.inspectedBy || '-';
    doc.font(this.fontBold);
    const labelWidth = doc.widthOfString(inspectionTypeLabel);
    doc.font(this.fontRegular);
    const valueWidth = doc.widthOfString(inspectionTypeValue);
    const totalInspectionWidth = labelWidth + valueWidth;
    const inspectionTypeX =
      startX + thirdWidth + (thirdWidth - totalInspectionWidth) / 2;

    doc.font(this.fontBold).text(inspectionTypeLabel, inspectionTypeX, startY, {
      continued: true,
    });
    doc.font(this.fontRegular).text(inspectionTypeValue, { underline: true });

    // Date - right aligned
    const dateLabel = 'DATE: ';
    const dateValue = inspectionDate;
    doc.font(this.fontBold);
    const dateLabelWidth = doc.widthOfString(dateLabel);
    doc.font(this.fontRegular);
    const dateValueWidth = doc.widthOfString(dateValue);
    const totalDateWidth = dateLabelWidth + dateValueWidth;
    const dateX = startX + pageWidth - totalDateWidth;

    doc.font(this.fontBold).text(dateLabel, dateX, startY, { continued: true });
    doc.font(this.fontRegular).text(dateValue, { underline: true });

    doc.y = startY + 25;
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    report: InspectionReportWithRelations,
    pageWidth: number,
    signatureCache: Map<string, Buffer>,
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

    // Helper function to draw headers on a new page
    const drawHeadersOnNewPage = (): number => {
      let y = doc.page.margins.top;

      // Redraw group headers on new page
      doc.fontSize(8).font(this.fontBold);

      // SHIP STAFF header
      doc.rect(startX, y, shipStaffWidth, groupHeaderHeight).stroke();
      doc.text('SHIP STAFF', startX, y + 4, {
        width: shipStaffWidth,
        align: 'center',
      });

      // OFFICE header
      doc
        .rect(startX + shipStaffWidth, y, officeWidth, groupHeaderHeight)
        .stroke();
      doc.text('OFFICE', startX + shipStaffWidth, y + 4, {
        width: officeWidth,
        align: 'center',
      });

      y += groupHeaderHeight;

      // Redraw column headers on new page - first borders
      doc.fontSize(fontSize).font(this.fontBold);
      let headerX = startX;

      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;
        doc.rect(headerX, y, colWidth, headerHeight).stroke();
        headerX += colWidth;
      });

      // Then header text - vertically centered with clipping
      headerX = startX;
      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;

        doc.save();
        doc.rect(headerX + 1, y + 1, colWidth - 2, headerHeight - 2).clip();

        const headerTextHeight = doc.heightOfString(col.header, {
          width: colWidth - padding * 2,
        });
        const headerVerticalOffset = (headerHeight - headerTextHeight) / 2;

        doc.text(col.header, headerX + padding, y + headerVerticalOffset, {
          width: colWidth - padding * 2,
          align: 'center',
        });

        doc.restore();
        headerX += colWidth;
      });

      y += headerHeight;
      doc.font(this.fontRegular).fontSize(fontSize);

      return y;
    };

    // Draw data rows
    entries.forEach((entry) => {
      // Calculate exact row height based on content
      const contentHeight = this.calculateRowHeight(
        doc,
        entry,
        columns,
        pageWidth,
        fontSize,
        padding,
        signatureCache,
      );
      const currentRowHeight = Math.max(rowHeight, contentHeight);

      const pageBottom = doc.page.height - doc.page.margins.bottom - 30;
      const availableHeight = pageBottom - startY;
      const minUsableSpace = rowHeight * 2; // At least space for 2 normal rows

      // If there's very little space left, move to new page first
      if (availableHeight < minUsableSpace) {
        doc.addPage();
        startY = drawHeadersOnNewPage();
      }

      // Recalculate available height after potential page change
      const newAvailableHeight = pageBottom - startY;

      // If row fits on current page, draw normally
      if (currentRowHeight <= newAvailableHeight) {
        this.drawEntryRow(
          doc,
          entry,
          columns,
          startX,
          startY,
          pageWidth,
          currentRowHeight,
          padding,
          fontSize,
          signatureCache,
        );
        startY += currentRowHeight;
      } else {
        // Row is too tall - split across pages
        startY = this.drawEntryRowSplit(
          doc,
          entry,
          columns,
          startX,
          startY,
          pageWidth,
          padding,
          fontSize,
          signatureCache,
          drawHeadersOnNewPage,
        );
      }
    });

    // If no entries, show empty message
    if (entries.length === 0) {
      doc.text('No entries found.', startX, startY + 10);
    }
  }

  /**
   * Draw a single entry row (all cells)
   */
  private drawEntryRow(
    doc: PDFKit.PDFDocument,
    entry: InspectionEntryWithRelations,
    columns: ColumnDefinition[],
    startX: number,
    startY: number,
    pageWidth: number,
    rowHeight: number,
    padding: number,
    fontSize: number,
    signatureCache: Map<string, Buffer>,
  ): void {
    // Draw row borders first
    let x = startX;
    columns.forEach((col) => {
      const colWidth = pageWidth * col.width;
      doc.rect(x, startY, colWidth, rowHeight).stroke();
      x += colWidth;
    });

    // Draw cell content
    x = startX;
    doc.font(this.fontRegular).fontSize(fontSize);
    columns.forEach((col) => {
      const colWidth = pageWidth * col.width;

      if (col.key === 'remarks') {
        this.drawRemarksCell(
          doc,
          entry,
          x,
          startY,
          colWidth,
          rowHeight,
          padding,
          fontSize,
          signatureCache,
        );
        x += colWidth;
        return;
      }

      let value = '';
      if (col.key === 'completionDate') {
        value = entry.completionDate
          ? new Date(entry.completionDate).toLocaleDateString()
          : '';
      } else {
        value = this.getEntryValue(entry, col.key);
      }

      if (value) {
        const textHeight = doc.heightOfString(value, {
          width: colWidth - padding * 2,
          lineGap: 1,
        });

        // Only center vertically for short content (SR NO, dates)
        // For long content like Company Analysis, start from top
        const shouldCenter = col.key === 'srNo' || col.key === 'completionDate';
        const verticalOffset = shouldCenter
          ? Math.max(padding, (rowHeight - textHeight) / 2)
          : padding;

        doc.text(value, x + padding, startY + verticalOffset, {
          width: colWidth - padding * 2,
          lineGap: 1,
          align: shouldCenter ? 'center' : 'left',
        });
      }
      x += colWidth;
    });
  }

  /**
   * Draw an entry row that splits across multiple pages
   */
  private drawEntryRowSplit(
    doc: PDFKit.PDFDocument,
    entry: InspectionEntryWithRelations,
    columns: ColumnDefinition[],
    startX: number,
    startY: number,
    pageWidth: number,
    padding: number,
    fontSize: number,
    signatureCache: Map<string, Buffer>,
    drawHeadersOnNewPage: () => number,
  ): number {
    const pageBottom = doc.page.height - doc.page.margins.bottom - 30;

    // Get the text content for each column
    const cellContents: Map<string, string> = new Map();
    columns.forEach((col) => {
      if (col.key === 'completionDate') {
        cellContents.set(
          col.key,
          entry.completionDate
            ? new Date(entry.completionDate).toLocaleDateString()
            : '',
        );
      } else if (col.key !== 'remarks') {
        cellContents.set(col.key, this.getEntryValue(entry, col.key));
      }
    });

    // Calculate height needed for each column
    doc.font(this.fontRegular).fontSize(fontSize);
    const columnHeights: Map<string, number> = new Map();
    let maxHeight = 0;

    columns.forEach((col) => {
      const colWidth = pageWidth * col.width;
      const textWidth = colWidth - padding * 2;

      if (col.key === 'remarks') {
        // Remarks column has fixed height for signature
        columnHeights.set(col.key, 60);
      } else {
        const value = cellContents.get(col.key) || '';
        if (value) {
          const height = doc.heightOfString(value, {
            width: textWidth,
            lineGap: 1,
          });
          columnHeights.set(col.key, height + padding * 2);
        } else {
          columnHeights.set(col.key, 20);
        }
      }
      maxHeight = Math.max(maxHeight, columnHeights.get(col.key) || 0);
    });

    // Calculate line height for snapping to line boundaries
    // Line height = font size + lineGap
    const lineHeight = fontSize + 1; // fontSize + lineGap of 1

    // Track rendering position
    let currentY = startY;
    let renderedHeight = 0;
    let isFirstSegment = true;

    while (renderedHeight < maxHeight) {
      const availableHeight = pageBottom - currentY;
      const remainingHeight = maxHeight - renderedHeight;

      // Calculate segment height, snapping to line boundaries
      let segmentHeight: number;
      if (remainingHeight <= availableHeight) {
        // All remaining content fits - use exact remaining height
        segmentHeight = remainingHeight;
      } else {
        // Need to split - snap to complete lines
        // Available content area = availableHeight - padding (top)
        const contentArea = availableHeight - padding;
        // Number of complete lines that fit
        const completeLines = Math.floor(contentArea / lineHeight);
        // Segment height = complete lines + padding
        segmentHeight = completeLines * lineHeight + padding;
        // Ensure minimum height
        if (segmentHeight < lineHeight + padding) {
          segmentHeight = lineHeight + padding;
        }
      }

      // Draw cell borders for this segment
      let x = startX;
      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;
        doc.rect(x, currentY, colWidth, segmentHeight).stroke();
        x += colWidth;
      });

      // Draw cell contents
      x = startX;
      doc.font(this.fontRegular).fontSize(fontSize);

      columns.forEach((col) => {
        const colWidth = pageWidth * col.width;

        if (col.key === 'remarks') {
          // Only draw remarks on first segment
          if (isFirstSegment) {
            this.drawRemarksCell(
              doc,
              entry,
              x,
              currentY,
              colWidth,
              segmentHeight,
              padding,
              fontSize,
              signatureCache,
            );
          }
          x += colWidth;
          return;
        }

        const value = cellContents.get(col.key) || '';
        if (value) {
          // Save graphics state and clip to cell
          doc.save();
          doc.rect(x, currentY, colWidth, segmentHeight).clip();

          const textHeight = doc.heightOfString(value, {
            width: colWidth - padding * 2,
            lineGap: 1,
          });

          const shouldCenter =
            col.key === 'srNo' || col.key === 'completionDate';

          // Calculate Y position - offset by already rendered content
          let textY: number;
          if (shouldCenter && textHeight <= segmentHeight - padding * 2) {
            // Center short content vertically
            textY = currentY + (segmentHeight - textHeight) / 2;
          } else {
            // For long content, offset by rendered height to show continuation
            textY = currentY + padding - renderedHeight;
          }

          doc.text(value, x + padding, textY, {
            width: colWidth - padding * 2,
            lineGap: 1,
            align: shouldCenter ? 'center' : 'left',
          });

          doc.restore();
        }
        x += colWidth;
      });

      renderedHeight += segmentHeight;
      currentY += segmentHeight;
      isFirstSegment = false;

      // Check if we need to continue on next page
      if (renderedHeight < maxHeight) {
        doc.addPage();
        currentY = drawHeadersOnNewPage();
      }
    }

    return currentY;
  }

  /**
   * Draw the remarks cell with signature image (if available) or fallback to badge text
   */
  private drawRemarksCell(
    doc: PDFKit.PDFDocument,
    entry: InspectionEntryWithRelations,
    x: number,
    y: number,
    colWidth: number,
    rowHeight: number,
    padding: number,
    fontSize: number,
    signatureCache: Map<string, Buffer>,
  ): void {
    const status = this.formatStatus(entry.status);
    const signUser = entry.officeSignUser;
    const signDate = entry.officeSignDate
      ? new Date(entry.officeSignDate).toLocaleDateString()
      : '';

    // Check if we have a signature image for this user
    const signatureBuffer = signUser ? signatureCache.get(signUser.id) : null;

    doc.save();
    doc.rect(x + 1, y + 1, colWidth - 2, rowHeight - 2).clip();

    if (signatureBuffer && signUser) {
      // Calculate total content height for vertical centering
      doc.font(this.fontRegular).fontSize(fontSize);
      const statusText = status;
      const statusHeight = doc.heightOfString(statusText, {
        width: colWidth - padding * 2,
      });
      const signatureHeight = 25;
      doc.fontSize(fontSize - 1);
      const nameAndDate = [signUser.name, signDate].filter(Boolean).join(' - ');
      const nameDateHeight = doc.heightOfString(nameAndDate || 'X', {
        width: colWidth - padding * 2,
      });
      const totalContentHeight =
        statusHeight + signatureHeight + nameDateHeight + 6; // 6 for gaps
      const verticalOffset = Math.max(
        padding,
        (rowHeight - totalContentHeight) / 2,
      );

      // Draw status text - horizontally centered
      doc.font(this.fontRegular).fontSize(fontSize);
      doc.text(statusText, x + padding, y + verticalOffset, {
        width: colWidth - padding * 2,
        align: 'center',
      });

      // Draw signature image - horizontally centered
      const signatureWidth = Math.min(colWidth - padding * 2, 60);
      const signatureStartY = y + verticalOffset + statusHeight + 2;
      const signatureX = x + (colWidth - signatureWidth) / 2;

      try {
        doc.image(signatureBuffer, signatureX, signatureStartY, {
          width: signatureWidth,
          height: signatureHeight,
          fit: [signatureWidth, signatureHeight],
        });

        // Draw signer name and date below signature - horizontally centered
        const textY = signatureStartY + signatureHeight + 2;
        doc.fontSize(fontSize - 1);
        doc.text(nameAndDate, x + padding, textY, {
          width: colWidth - padding * 2,
          align: 'center',
        });
      } catch (error) {
        // If signature image fails, fall back to text
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to render signature image: ${errorMessage}`);
        this.drawRemarksFallback(
          doc,
          x,
          y,
          colWidth,
          rowHeight,
          padding,
          fontSize,
          status,
          signUser?.name || '',
          signDate,
        );
      }
    } else {
      // Fallback: Draw badge-style text (status, name, date)
      this.drawRemarksFallback(
        doc,
        x,
        y,
        colWidth,
        rowHeight,
        padding,
        fontSize,
        status,
        signUser?.name || '',
        signDate,
      );
    }

    doc.restore();
  }

  /**
   * Fallback method to draw remarks as text (badge style) - center aligned
   */
  private drawRemarksFallback(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    colWidth: number,
    rowHeight: number,
    padding: number,
    fontSize: number,
    status: string,
    signerName: string,
    signDate: string,
  ): void {
    const value = [status, signerName, signDate].filter(Boolean).join('\n');

    if (value) {
      doc.font(this.fontRegular).fontSize(fontSize);
      const textHeight = doc.heightOfString(value, {
        width: colWidth - padding * 2,
        align: 'center',
      });
      const verticalOffset = Math.max(padding, (rowHeight - textHeight) / 2);

      doc.text(value, x + padding, y + verticalOffset, {
        width: colWidth - padding * 2,
        lineGap: 1,
        align: 'center',
      });
    }
  }

  private calculateRowHeight(
    doc: PDFKit.PDFDocument,
    entry: InspectionEntryWithRelations,
    columns: ColumnDefinition[],
    pageWidth: number,
    fontSize: number,
    padding: number,
    signatureCache?: Map<string, Buffer>,
  ): number {
    let maxHeight = 20;

    columns.forEach((col) => {
      // Use the same width calculation as in drawEntryRow for consistency
      const colWidth = pageWidth * col.width;
      const textWidth = colWidth - padding * 2;
      let text = '';

      if (col.key === 'remarks') {
        // Check if this entry has a signature image
        const signUser = entry.officeSignUser;
        const hasSignature =
          signUser && signatureCache && signatureCache.has(signUser.id);

        if (hasSignature) {
          // Need more height for: status text + signature image + name/date
          // Status text height + signature (25) + name/date text + padding
          const status = this.formatStatus(entry.status);
          doc.fontSize(fontSize);
          const statusHeight = doc.heightOfString(status, {
            width: textWidth,
            lineGap: 1,
          });
          const signatureHeight = 25;
          const nameDate = [signUser?.name, entry.officeSignDate ? 'date' : '']
            .filter(Boolean)
            .join(' - ');
          doc.fontSize(fontSize - 1);
          const nameDateHeight = doc.heightOfString(nameDate || 'X', {
            width: textWidth,
            lineGap: 1,
          });
          const totalHeight =
            statusHeight + signatureHeight + nameDateHeight + padding * 3 + 6;
          maxHeight = Math.max(maxHeight, totalHeight);
        } else {
          const status = this.formatStatus(entry.status);
          const sign = entry.officeSignUser?.name || '';
          const date = entry.officeSignDate
            ? new Date(entry.officeSignDate).toLocaleDateString()
            : '';
          text = [status, sign, date].filter(Boolean).join('\n');
        }
      } else if (col.key === 'completionDate') {
        text = entry.completionDate
          ? new Date(entry.completionDate).toLocaleDateString()
          : '';
      } else {
        text = this.getEntryValue(entry, col.key);
      }

      if (text) {
        doc.fontSize(fontSize);
        // Include lineGap in height calculation to match actual rendering
        const textHeight = doc.heightOfString(text, {
          width: textWidth,
          lineGap: 1,
        });
        maxHeight = Math.max(maxHeight, textHeight + padding * 2);
      }
    });

    // Return the exact calculated height - no capping
    // The drawing logic will handle page overflow
    return maxHeight;
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
