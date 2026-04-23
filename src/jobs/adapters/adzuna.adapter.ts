import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  AdzunaJob,
  AdzunaSearchResponse,
  NormalizedJob,
} from './adzuna.types';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';
export const ADZUNA_SOURCE = 'ADZUNA';
const DESCRIPTION_MAX_CHARS = 500;

export interface FetchInternshipsOptions {
  country?: string;
  query?: string;
  page?: number;
  resultsPerPage?: number;
}

@Injectable()
export class AdzunaAdapter {
  private readonly logger = new Logger(AdzunaAdapter.name);
  private readonly appId: string;
  private readonly appKey: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.appId = config.getOrThrow<string>('ADZUNA_APP_ID');
    this.appKey = config.getOrThrow<string>('ADZUNA_APP_KEY');
  }

  async fetchInternships(
    opts: FetchInternshipsOptions = {},
  ): Promise<NormalizedJob[]> {
    const country = opts.country ?? 'gb';
    const page = opts.page ?? 1;
    const url = `${ADZUNA_BASE}/${country}/search/${page}`;
    const params = {
      app_id: this.appId,
      app_key: this.appKey,
      what: opts.query ?? 'internship',
      results_per_page: opts.resultsPerPage ?? 50,
      sort_by: 'date',
    };

    this.logger.log(
      `Fetching Adzuna ${country} page=${page} query="${params.what}"`,
    );

    const response = await firstValueFrom(
      this.http.get<AdzunaSearchResponse>(url, { params }),
    );

    return response.data.results
      .filter((job) => job.id && job.redirect_url && job.created)
      .map((job) => this.normalize(job));
  }

  private normalize(job: AdzunaJob): NormalizedJob {
    return {
      source: ADZUNA_SOURCE,
      sourceId: job.id,
      title: job.title,
      company: job.company?.display_name ?? 'Unknown',
      location: job.location?.display_name ?? null,
      description: sanitizeDescription(job.description),
      applyUrl: job.redirect_url,
      salary: formatSalary(
        job.salary_min,
        job.salary_max,
        job.salary_is_predicted,
      ),
      postedAt: new Date(job.created),
    };
  }
}

function formatSalary(
  min: number | undefined,
  max: number | undefined,
  isPredicted: string | undefined,
): string | null {
  if (isPredicted === '1') return null;
  if (!min || !max) return null;
  const fmt = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
  return `${fmt(min)}–${fmt(max)}`;
}

function sanitizeDescription(raw: string | undefined): string | null {
  if (!raw) return null;
  const stripped = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return null;
  return stripped.length > DESCRIPTION_MAX_CHARS
    ? stripped.slice(0, DESCRIPTION_MAX_CHARS - 1).trimEnd() + '…'
    : stripped;
}
