import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

const INGEST_HEADER = 'x-ingest-token';

@Injectable()
export class IngestTokenGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService) {
    this.expected = Buffer.from(config.getOrThrow<string>('INGEST_TOKEN'));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[INGEST_HEADER];
    const token = Array.isArray(provided) ? provided[0] : provided;

    if (!token) {
      throw new UnauthorizedException('Invalid ingest token');
    }

    const providedBuf = Buffer.from(token);
    if (
      providedBuf.length !== this.expected.length ||
      !timingSafeEqual(providedBuf, this.expected)
    ) {
      throw new UnauthorizedException('Invalid ingest token');
    }
    return true;
  }
}
