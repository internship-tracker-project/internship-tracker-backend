import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ADZUNA_SOURCE, AdzunaAdapter } from './adzuna.adapter';
import type { AdzunaJob } from './adzuna.types';

type PartialAdzunaJob = Partial<AdzunaJob> & { id?: string };

const makeResponse = (results: PartialAdzunaJob[]) => ({
  data: {
    count: results.length,
    results: results.map((r) => ({
      id: 'x',
      title: 't',
      redirect_url: 'https://example.com/x',
      created: '2026-04-20T12:00:00Z',
      ...r,
    })),
  },
});

describe('AdzunaAdapter', () => {
  let adapter: AdzunaAdapter;
  let http: { get: jest.Mock };

  beforeEach(async () => {
    http = { get: jest.fn() };
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'ADZUNA_APP_ID') return 'app-id';
        if (key === 'ADZUNA_APP_KEY') return 'app-key';
        throw new Error(`Unexpected key ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdzunaAdapter,
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    adapter = module.get<AdzunaAdapter>(AdzunaAdapter);
  });

  type GetCall = [string, { params: Record<string, unknown> }];

  it('builds the correct URL and params', async () => {
    http.get.mockReturnValue(of(makeResponse([])));

    await adapter.fetchInternships({ country: 'gb', query: 'intern', page: 2 });

    const [url, options] = http.get.mock.calls[0] as GetCall;
    expect(url).toBe('https://api.adzuna.com/v1/api/jobs/gb/search/2');
    expect(options.params).toMatchObject({
      app_id: 'app-id',
      app_key: 'app-key',
      what: 'intern',
      results_per_page: 50,
      sort_by: 'date',
    });
  });

  it('defaults to country gb, page 1, internship query, 50 results', async () => {
    http.get.mockReturnValue(of(makeResponse([])));

    await adapter.fetchInternships();

    const [url, options] = http.get.mock.calls[0] as GetCall;
    expect(url).toBe('https://api.adzuna.com/v1/api/jobs/gb/search/1');
    expect(options.params.what).toBe('internship');
    expect(options.params.results_per_page).toBe(50);
  });

  it('drops listings missing id, redirect_url, or created', async () => {
    http.get.mockReturnValue(
      of(
        makeResponse([
          { id: '', title: 'no id' },
          { id: '1', redirect_url: '' },
          { id: '2', created: '' },
          { id: '3', redirect_url: 'https://ok', created: '2026-04-20' },
        ]),
      ),
    );

    const result = await adapter.fetchInternships();
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('3');
  });

  it('normalises company, location, applyUrl, postedAt, source', async () => {
    http.get.mockReturnValue(
      of(
        makeResponse([
          {
            id: '7',
            title: 'SWE Intern',
            company: { display_name: 'Acme' },
            location: { display_name: 'London' },
            description: '<p>Hello &amp; welcome</p>',
            redirect_url: 'https://example.com/7',
            created: '2026-04-20T12:00:00Z',
          },
        ]),
      ),
    );

    const [job] = await adapter.fetchInternships();
    expect(job.source).toBe(ADZUNA_SOURCE);
    expect(ADZUNA_SOURCE).toBe('ADZUNA');
    expect(job.sourceId).toBe('7');
    expect(job.title).toBe('SWE Intern');
    expect(job.company).toBe('Acme');
    expect(job.location).toBe('London');
    expect(job.description).toBe('Hello & welcome');
    expect(job.applyUrl).toBe('https://example.com/7');
    expect(job.postedAt).toEqual(new Date('2026-04-20T12:00:00Z'));
  });

  it('defaults company to "Unknown" and location to null when missing', async () => {
    http.get.mockReturnValue(of(makeResponse([{ id: '1' }])));
    const [job] = await adapter.fetchInternships();
    expect(job.company).toBe('Unknown');
    expect(job.location).toBeNull();
  });

  it('strips HTML tags and truncates description over 500 chars', async () => {
    const long = '<p>' + 'word '.repeat(200) + '</p>';
    http.get.mockReturnValue(
      of(makeResponse([{ id: '1', description: long }])),
    );
    const [job] = await adapter.fetchInternships();
    expect(job.description).not.toContain('<');
    expect(job.description!.length).toBeLessThanOrEqual(500);
    expect(job.description!.endsWith('…')).toBe(true);
  });

  it('returns null description when source is empty or only whitespace', async () => {
    http.get.mockReturnValue(
      of(makeResponse([{ id: '1', description: '   ' }])),
    );
    const [job] = await adapter.fetchInternships();
    expect(job.description).toBeNull();
  });

  it('decodes common HTML entities', async () => {
    http.get.mockReturnValue(
      of(
        makeResponse([
          {
            id: '1',
            description: 'A &amp; B &lt;x&gt; &quot;q&quot; it&#39;s &nbsp;end',
          },
        ]),
      ),
    );
    const [job] = await adapter.fetchInternships();
    expect(job.description).toBe('A & B <x> "q" it\'s end');
  });

  describe('salary formatting', () => {
    const withSalary = (
      min: number | undefined,
      max: number | undefined,
      isPredicted: string | undefined,
    ) =>
      makeResponse([
        {
          id: '1',
          salary_min: min,
          salary_max: max,
          salary_is_predicted: isPredicted,
        },
      ]);

    it('formats when both min and max present and not predicted', async () => {
      http.get.mockReturnValue(of(withSalary(20000, 25000, '0')));
      const [job] = await adapter.fetchInternships();
      expect(job.salary).toBe('£20,000–£25,000');
    });

    it('returns null when salary is predicted', async () => {
      http.get.mockReturnValue(of(withSalary(20000, 25000, '1')));
      const [job] = await adapter.fetchInternships();
      expect(job.salary).toBeNull();
    });

    it('returns null when only min is present', async () => {
      http.get.mockReturnValue(of(withSalary(20000, undefined, '0')));
      const [job] = await adapter.fetchInternships();
      expect(job.salary).toBeNull();
    });

    it('returns null when only max is present', async () => {
      http.get.mockReturnValue(of(withSalary(undefined, 25000, '0')));
      const [job] = await adapter.fetchInternships();
      expect(job.salary).toBeNull();
    });

    it('returns null when neither is present', async () => {
      http.get.mockReturnValue(of(withSalary(undefined, undefined, undefined)));
      const [job] = await adapter.fetchInternships();
      expect(job.salary).toBeNull();
    });
  });
});
