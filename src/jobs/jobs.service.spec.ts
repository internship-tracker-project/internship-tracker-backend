import { Test, TestingModule } from '@nestjs/testing';
import type { NormalizedJob } from './adapters/adzuna.types';
import { AdzunaAdapter } from './adapters/adzuna.adapter';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';

const normalizedJob = (
  overrides: Partial<NormalizedJob> = {},
): NormalizedJob => ({
  source: 'ADZUNA',
  sourceId: 'adz-1',
  title: 'Software Engineering Intern',
  company: 'Acme',
  location: 'London',
  description: 'Great internship',
  applyUrl: 'https://example.com/job/1',
  salary: null,
  postedAt: new Date('2026-04-20T12:00:00Z'),
  ...overrides,
});

const makePrismaMock = () => ({
  jobListing: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
});

const makeAdzunaMock = () => ({
  fetchInternships: jest.fn(),
});

describe('JobsService', () => {
  let service: JobsService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let adzuna: ReturnType<typeof makeAdzunaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    adzuna = makeAdzunaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdzunaAdapter, useValue: adzuna },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  describe('ingest', () => {
    it('upserts every fetched listing and returns counts', async () => {
      const jobs = [
        normalizedJob({ sourceId: 'adz-1' }),
        normalizedJob({ sourceId: 'adz-2' }),
      ];
      adzuna.fetchInternships.mockResolvedValue(jobs);
      prisma.jobListing.upsert.mockResolvedValue({});

      const result = await service.ingest({ country: 'gb' });

      expect(adzuna.fetchInternships).toHaveBeenCalledWith({
        country: 'gb',
        page: 1,
        resultsPerPage: 50,
      });
      expect(prisma.jobListing.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.jobListing.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            source_sourceId: { source: 'ADZUNA', sourceId: 'adz-1' },
          },
          create: jobs[0],
        }),
      );
      expect(result).toEqual({ fetched: 2, upserted: 2, failed: 0 });
    });

    it('counts per-row failures without aborting the batch', async () => {
      const jobs = [
        normalizedJob({ sourceId: 'ok-1' }),
        normalizedJob({ sourceId: 'bad-1' }),
        normalizedJob({ sourceId: 'ok-2' }),
      ];
      adzuna.fetchInternships.mockResolvedValue(jobs);
      prisma.jobListing.upsert
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('db fail'))
        .mockResolvedValueOnce({});

      const result = await service.ingest();

      expect(prisma.jobListing.upsert).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ fetched: 3, upserted: 2, failed: 1 });
    });

    it('returns zeros when the adapter returns no listings', async () => {
      adzuna.fetchInternships.mockResolvedValue([]);

      const result = await service.ingest();

      expect(prisma.jobListing.upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ fetched: 0, upserted: 0, failed: 0 });
    });

    it('loops pages until a short page is returned, capped at 10', async () => {
      const full = Array.from({ length: 50 }, (_, i) =>
        normalizedJob({ sourceId: `f-${i}` }),
      );
      const partial = [normalizedJob({ sourceId: 'p-1' })];

      adzuna.fetchInternships
        .mockResolvedValueOnce(full)
        .mockResolvedValueOnce(full)
        .mockResolvedValueOnce(partial);

      prisma.jobListing.upsert.mockResolvedValue({});

      const result = await service.ingest();

      expect(adzuna.fetchInternships).toHaveBeenCalledTimes(3);
      expect(adzuna.fetchInternships).toHaveBeenNthCalledWith(1, {
        page: 1,
        resultsPerPage: 50,
      });
      expect(adzuna.fetchInternships).toHaveBeenNthCalledWith(2, {
        page: 2,
        resultsPerPage: 50,
      });
      expect(adzuna.fetchInternships).toHaveBeenNthCalledWith(3, {
        page: 3,
        resultsPerPage: 50,
      });
      expect(result.fetched).toBe(101);
    });

    it('stops after 10 pages even if every page is full', async () => {
      const full = Array.from({ length: 50 }, (_, i) =>
        normalizedJob({ sourceId: `f-${i}` }),
      );
      adzuna.fetchInternships.mockResolvedValue(full);
      prisma.jobListing.upsert.mockResolvedValue({});

      const result = await service.ingest();

      expect(adzuna.fetchInternships).toHaveBeenCalledTimes(10);
      expect(result.fetched).toBe(500);
    });

    it('fetches only the requested page when page is explicit', async () => {
      adzuna.fetchInternships.mockResolvedValue([]);

      await service.ingest({ page: 3 });

      expect(adzuna.fetchInternships).toHaveBeenCalledTimes(1);
      expect(adzuna.fetchInternships).toHaveBeenCalledWith({ page: 3 });
    });
  });

  describe('list', () => {
    const row = {
      id: 'jl-1',
      source: 'ADZUNA',
      sourceId: 'adz-1',
      title: 'SWE Intern',
      company: 'Acme',
      location: 'London',
      description: null,
      applyUrl: 'https://example.com/1',
      salary: null,
      postedAt: new Date('2026-04-20'),
      fetchedAt: new Date('2026-04-21'),
    };

    it('returns defaults: page 1, pageSize 20, no filters', async () => {
      prisma.$transaction.mockResolvedValue([1, [row]]);

      const result = await service.list();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.jobListing.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.jobListing.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { postedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        results: [row],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it('applies q as a case-insensitive OR across title and company only', async () => {
      prisma.$transaction.mockResolvedValue([0, []]);

      await service.list({ q: 'intern' });

      expect(prisma.jobListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { title: { contains: 'intern', mode: 'insensitive' } },
                  { company: { contains: 'intern', mode: 'insensitive' } },
                ],
              },
            ],
          },
        }),
      );
    });

    it('applies location as a case-insensitive contains', async () => {
      prisma.$transaction.mockResolvedValue([0, []]);

      await service.list({ location: 'london' });

      expect(prisma.jobListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [{ location: { contains: 'london', mode: 'insensitive' } }],
          },
        }),
      );
    });

    it('combines q and location with AND', async () => {
      prisma.$transaction.mockResolvedValue([0, []]);

      await service.list({ q: 'intern', location: 'london' });

      const calls = prisma.jobListing.findMany.mock.calls as [
        { where: { AND: unknown[] } },
      ][];
      expect(calls[0][0].where.AND).toHaveLength(2);
    });

    it('computes skip/take from page and pageSize', async () => {
      prisma.$transaction.mockResolvedValue([55, []]);

      const result = await service.list({ page: 3, pageSize: 10 });

      expect(prisma.jobListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.total).toBe(55);
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
    });
  });
});
