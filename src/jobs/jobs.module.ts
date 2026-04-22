import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdzunaAdapter } from './adapters/adzuna.adapter';
import { IngestTokenGuard } from './guards/ingest-token.guard';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [HttpModule.register({ timeout: 10000 }), PrismaModule],
  controllers: [JobsController],
  providers: [AdzunaAdapter, IngestTokenGuard, JobsService],
  exports: [AdzunaAdapter, JobsService],
})
export class JobsModule {}
