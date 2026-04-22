import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngestJobsDto } from './dto/ingest-jobs.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { IngestTokenGuard } from './guards/ingest-token.guard';
import type { IngestResult, ListJobsResult } from './jobs.service';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() dto: ListJobsDto): Promise<ListJobsResult> {
    return this.jobsService.list(dto);
  }

  @Post('ingest')
  @HttpCode(200)
  @UseGuards(IngestTokenGuard)
  ingest(@Body() dto: IngestJobsDto): Promise<IngestResult> {
    return this.jobsService.ingest(dto);
  }
}
