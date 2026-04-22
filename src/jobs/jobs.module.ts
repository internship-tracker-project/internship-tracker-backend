import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AdzunaAdapter } from './adapters/adzuna.adapter';

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  providers: [AdzunaAdapter],
  exports: [AdzunaAdapter],
})
export class JobsModule {}
