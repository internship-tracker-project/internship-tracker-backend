import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngestTokenGuard } from './guards/ingest-token.guard';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let service: { list: jest.Mock; ingest: jest.Mock };

  beforeEach(async () => {
    service = { list: jest.fn(), ingest: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(IngestTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('list() delegates to service with dto and returns its result', async () => {
    const expected = { results: [], total: 0, page: 1, pageSize: 20 };
    service.list.mockResolvedValue(expected);

    const result = await controller.list({ q: 'intern', location: 'london' });

    expect(service.list).toHaveBeenCalledWith({
      q: 'intern',
      location: 'london',
    });
    expect(result).toBe(expected);
  });

  it('ingest() delegates to service with dto and returns its result', async () => {
    const expected = { fetched: 10, upserted: 10, failed: 0 };
    service.ingest.mockResolvedValue(expected);

    const result = await controller.ingest({ country: 'gb' });

    expect(service.ingest).toHaveBeenCalledWith({ country: 'gb' });
    expect(result).toBe(expected);
  });
});
