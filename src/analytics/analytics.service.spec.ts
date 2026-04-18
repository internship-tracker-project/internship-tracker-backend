import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user-uuid-1';

const makePrismaMock = () => ({
  application: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRaw: jest.fn(),
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getSummary', () => {
    it('should return total, statusCounts, offerRate, and timeSeries for the user', async () => {
      prisma.application.count.mockResolvedValue(10);
      prisma.application.groupBy.mockResolvedValue([
        { status: 'APPLIED', _count: { _all: 5 } },
        { status: 'INTERVIEW', _count: { _all: 2 } },
        { status: 'OFFER', _count: { _all: 2 } },
        { status: 'REJECTED', _count: { _all: 1 } },
      ]);
      prisma.$queryRaw.mockResolvedValue([
        { weekStart: new Date('2026-04-06T00:00:00Z'), count: BigInt(3) },
        { weekStart: new Date('2026-04-13T00:00:00Z'), count: BigInt(7) },
      ]);

      const result = await service.getSummary(userId);

      expect(prisma.application.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.application.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      });
      expect(result).toEqual({
        total: 10,
        statusCounts: {
          APPLIED: 5,
          INTERVIEW: 2,
          OFFER: 2,
          REJECTED: 1,
        },
        offerRate: 0.2,
        timeSeries: [
          { weekStart: '2026-04-06', count: 3 },
          { weekStart: '2026-04-13', count: 7 },
        ],
      });
    });

    it('should zero-fill missing statuses in statusCounts', async () => {
      prisma.application.count.mockResolvedValue(3);
      prisma.application.groupBy.mockResolvedValue([
        { status: 'APPLIED', _count: { _all: 3 } },
      ]);
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result.statusCounts).toEqual({
        APPLIED: 3,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
      });
    });

    it('should return zero totals when the user has no applications', async () => {
      prisma.application.count.mockResolvedValue(0);
      prisma.application.groupBy.mockResolvedValue([]);
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getSummary(userId);

      expect(result).toEqual({
        total: 0,
        statusCounts: { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 },
        offerRate: 0,
        timeSeries: [],
      });
    });
  });
});
