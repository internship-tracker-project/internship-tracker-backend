import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdzunaAdapter } from './adapters/adzuna.adapter';
import type { FetchInternshipsOptions } from './adapters/adzuna.adapter';

export interface IngestResult {
  fetched: number;
  upserted: number;
  failed: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adzuna: AdzunaAdapter,
  ) {}

  async ingest(opts: FetchInternshipsOptions = {}): Promise<IngestResult> {
    const normalized = await this.adzuna.fetchInternships(opts);
    let upserted = 0;
    let failed = 0;

    for (const job of normalized) {
      try {
        await this.prisma.jobListing.upsert({
          where: {
            source_sourceId: { source: job.source, sourceId: job.sourceId },
          },
          create: job,
          update: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            applyUrl: job.applyUrl,
            salary: job.salary,
            postedAt: job.postedAt,
            fetchedAt: new Date(),
          },
        });
        upserted++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Upsert failed for ${job.source}:${job.sourceId} — ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    const result: IngestResult = {
      fetched: normalized.length,
      upserted,
      failed,
    };
    this.logger.log(
      `Ingest complete: fetched=${result.fetched} upserted=${result.upserted} failed=${result.failed}`,
    );
    return result;
  }
}
