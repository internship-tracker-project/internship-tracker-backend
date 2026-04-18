import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

const user = { sub: 'user-uuid-1', email: 'test@example.com' };

const mockSummary = {
  total: 4,
  statusCounts: { APPLIED: 2, INTERVIEW: 1, OFFER: 1, REJECTED: 0 },
  offerRate: 0.25,
  timeSeries: [{ weekStart: '2026-04-13', count: 4 }],
};

const makeServiceMock = () => ({
  getSummary: jest.fn(),
});

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: ReturnType<typeof makeServiceMock>;

  beforeEach(async () => {
    service = makeServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: service }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  describe('GET /analytics/summary', () => {
    it("should return the authenticated user's summary", async () => {
      service.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(user);

      expect(service.getSummary).toHaveBeenCalledWith(user.sub);
      expect(result).toEqual(mockSummary);
    });
  });
});
