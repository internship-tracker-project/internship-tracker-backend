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
export const ADZUNA_SOURCE = 'adzuna';

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
      description: job.description ?? null,
      applyUrl: job.redirect_url,
      salary: formatSalary(job.salary_min, job.salary_max),
      postedAt: new Date(job.created),
    };
  }
}

function formatSalary(min?: number, max?: number): string | null {
  const fmt = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `from ${fmt(min)}`;
  if (max) return `up to ${fmt(max)}`;
  return null;
}
