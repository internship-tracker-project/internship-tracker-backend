import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IngestJobsDto } from './dto/ingest-jobs.dto';
import { IngestTokenGuard } from './guards/ingest-token.guard';
import type { IngestResult } from './jobs.service';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('ingest')
  @HttpCode(200)
  @UseGuards(IngestTokenGuard)
  ingest(@Body() dto: IngestJobsDto): Promise<IngestResult> {
    return this.jobsService.ingest(dto);
  }
}
