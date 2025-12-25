import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@ship-reporting/prisma';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    name: 'Test User',
    role: RoleName.CAPTAIN,
    isActive: true,
    organizationId: 'org-123',
    assignedVesselId: 'vessel-123',
    signatureImage: null,
    organization: { id: 'org-123', name: 'Test Org' },
    assignedVessel: { id: 'vessel-123', name: 'Test Vessel' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        organizationId: 'org-123',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException if email exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          organizationId: 'org-123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findAll('org-123');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('should filter by organization if provided', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.findAll('org-123');

      expect(
        prismaService.user.findMany.bind(prismaService.user),
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-123' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user without password', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.update('user-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await service.remove('user-123');

      expect(
        prismaService.user.update.bind(prismaService.user),
      ).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { isActive: false },
      });
    });
  });
});
