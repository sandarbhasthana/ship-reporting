import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@ship-reporting/prisma';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockVessel = {
    id: 'vessel-123',
    name: 'Test Vessel',
    shipFileNo: 'SHIP-001',
    organizationId: 'org-123',
  };

  const mockReport = {
    id: 'report-123',
    vesselId: 'vessel-123',
    createdById: 'user-123',
    title: 'THIRD PARTY DEFICIENCY SUMMARY',
    shipFileNo: 'SHIP-001',
    officeFileNo: null,
    revisionNo: '1',
    formNo: 'FORM-001',
    applicableFomSections: null,
    inspectedBy: 'Inspector',
    inspectionDate: new Date(),
    vessel: mockVessel,
    createdBy: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
    entries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        {
          provide: PrismaService,
          useValue: {
            vessel: {
              findUnique: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
            inspectionReport: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an inspection report for Captain using assigned vessel', async () => {
      (prismaService.vessel.findUnique as jest.Mock).mockResolvedValue(
        mockVessel,
      );
      (prismaService.organization.findUnique as jest.Mock).mockResolvedValue({
        defaultFormNo: 'FORM-001',
      });
      (prismaService.inspectionReport.create as jest.Mock).mockResolvedValue(
        mockReport,
      );

      await service.create({}, 'user-123', RoleName.CAPTAIN, 'vessel-123');

      expect(prismaService.inspectionReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ vesselId: 'vessel-123' }),
        }),
      );
    });

    it('should throw ForbiddenException if Captain has no assigned vessel', async () => {
      await expect(
        service.create({}, 'user-123', RoleName.CAPTAIN, null),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if no vessel ID is provided for Admin', async () => {
      await expect(
        service.create({}, 'user-123', RoleName.ADMIN, null),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return an inspection report for Admin', async () => {
      (
        prismaService.inspectionReport.findUnique as jest.Mock
      ).mockResolvedValue(mockReport);

      const result = await service.findOne('report-123', RoleName.ADMIN, null);

      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      (
        prismaService.inspectionReport.findUnique as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', RoleName.ADMIN, null),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if Captain accesses report from different vessel', async () => {
      (
        prismaService.inspectionReport.findUnique as jest.Mock
      ).mockResolvedValue(mockReport);

      await expect(
        service.findOne('report-123', RoleName.CAPTAIN, 'other-vessel'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
