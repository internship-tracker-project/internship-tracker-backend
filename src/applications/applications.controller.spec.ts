import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const user = { sub: 'user-uuid-1', email: 'test@example.com' };

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
  userId: user.sub,
};

const makeServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: ReturnType<typeof makeServiceMock>;

  beforeEach(async () => {
    service = makeServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: service }],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  describe('POST /applications', () => {
    it('should create an application', async () => {
      service.create.mockResolvedValue(mockApplication);

      const result = await controller.create(user, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });

      expect(service.create).toHaveBeenCalledWith(user.sub, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });
      expect(result).toEqual(mockApplication);
    });
  });

  describe('GET /applications', () => {
    it('should return all applications for the user', async () => {
      service.findAll.mockResolvedValue([mockApplication]);

      const result = await controller.findAll(user);

      expect(service.findAll).toHaveBeenCalledWith(user.sub);
      expect(result).toEqual([mockApplication]);
    });
  });

  describe('GET /applications/:id', () => {
    it('should return a single application', async () => {
      service.findOne.mockResolvedValue(mockApplication);

      const result = await controller.findOne(user, mockApplication.id);

      expect(service.findOne).toHaveBeenCalledWith(mockApplication.id, user.sub);
      expect(result).toEqual(mockApplication);
    });

    it('should propagate NotFoundException', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Application not found'),
      );

      await expect(
        controller.findOne(user, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /applications/:id', () => {
    it('should update an application', async () => {
      const updated = { ...mockApplication, status: 'INTERVIEW' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(user, mockApplication.id, {
        status: 'INTERVIEW' as any,
      });

      expect(service.update).toHaveBeenCalledWith(
        mockApplication.id,
        user.sub,
        { status: 'INTERVIEW' },
      );
      expect(result).toEqual(updated);
    });
  });

  describe('DELETE /applications/:id', () => {
    it('should delete an application', async () => {
      service.remove.mockResolvedValue(mockApplication);

      const result = await controller.remove(user, mockApplication.id);

      expect(service.remove).toHaveBeenCalledWith(mockApplication.id, user.sub);
      expect(result).toEqual(mockApplication);
    });
  });
});
