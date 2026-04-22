import { Injectable, Logger } from '@nestjs/common';
import type { JobListing, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AdzunaAdapter } from './adapters/adzuna.adapter';
import type { FetchInternshipsOptions } from './adapters/adzuna.adapter';
import type { ListJobsDto } from './dto/list-jobs.dto';

export interface IngestResult {
  fetched: number;
  upserted: number;
  failed: number;
}

export interface ListJobsResult {
  results: JobListing[];
  total: number;
  page: number;
  pageSize: number;
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

  async list(dto: ListJobsDto = {}): Promise<ListJobsResult> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const where = this.buildWhere(dto);

    const [total, results] = await this.prisma.$transaction([
      this.prisma.jobListing.count({ where }),
      this.prisma.jobListing.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { results, total, page, pageSize };
  }

  private buildWhere(dto: ListJobsDto): Prisma.JobListingWhereInput {
    const conditions: Prisma.JobListingWhereInput[] = [];

    if (dto.q) {
      conditions.push({
        OR: [
          { title: { contains: dto.q, mode: 'insensitive' } },
          { company: { contains: dto.q, mode: 'insensitive' } },
          { description: { contains: dto.q, mode: 'insensitive' } },
        ],
      });
    }

    if (dto.location) {
      conditions.push({
        location: { contains: dto.location, mode: 'insensitive' },
      });
    }

    return conditions.length ? { AND: conditions } : {};
  }
}
