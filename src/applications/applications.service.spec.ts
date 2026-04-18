import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user-uuid-1';
const otherUserId = 'user-uuid-2';

const mockApplication = {
  id: 'app-uuid-1',
  company: 'Acme Corp',
  role: 'Software Engineer Intern',
  status: 'APPLIED',
  location: 'London',
  notes: null,
  appliedAt: new Date('2026-04-01'),
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  userId,
};

const makePrismaMock = () => ({
  application: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('create', () => {
    it('should create an application for the authenticated user', async () => {
      prisma.application.create.mockResolvedValue(mockApplication);

      const result = await service.create(userId, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });

      expect(prisma.application.create).toHaveBeenCalledWith({
        data: {
          company: 'Acme Corp',
          role: 'Software Engineer Intern',
          location: 'London',
          userId,
        },
      });
      expect(result).toEqual(mockApplication);
    });
  });

  describe('findAll', () => {
    it('should return all applications for the authenticated user', async () => {
      prisma.application.findMany.mockResolvedValue([mockApplication]);

      const result = await service.findAll(userId);

      expect(prisma.application.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockApplication]);
    });

    it('should return empty array when user has no applications', async () => {
      prisma.application.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an application owned by the user', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApplication);

      const result = await service.findOne(mockApplication.id, userId);

      expect(prisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: mockApplication.id, userId },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when application belongs to another user', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockApplication.id, otherUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an application owned by the user', async () => {
      const updated = { ...mockApplication, status: 'INTERVIEW' };
      prisma.application.findUnique.mockResolvedValue(mockApplication);
      prisma.application.update.mockResolvedValue(updated);

      const result = await service.update(mockApplication.id, userId, {
        status: 'INTERVIEW' as any,
      });

      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
        data: { status: 'INTERVIEW' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', userId, {
          status: 'INTERVIEW' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an application owned by the user', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApplication);
      prisma.application.delete.mockResolvedValue(mockApplication);

      const result = await service.remove(mockApplication.id, userId);

      expect(prisma.application.delete).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
