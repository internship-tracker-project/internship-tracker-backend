import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestTokenGuard } from './ingest-token.guard';

const makeContext = (headers: Record<string, unknown>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

const config = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'INGEST_TOKEN') return 'secret-value';
    throw new Error(`Unexpected key ${key}`);
  }),
} as unknown as ConfigService;

describe('IngestTokenGuard', () => {
  it('allows when header matches', () => {
    const guard = new IngestTokenGuard(config);
    const ctx = makeContext({ 'x-ingest-token': 'secret-value' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when header is missing', () => {
    const guard = new IngestTokenGuard(config);
    expect(() => guard.canActivate(makeContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when header value is wrong', () => {
    const guard = new IngestTokenGuard(config);
    const ctx = makeContext({ 'x-ingest-token': 'wrong-value-same-len' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rejects when header length differs from expected', () => {
    const guard = new IngestTokenGuard(config);
    const ctx = makeContext({ 'x-ingest-token': 'short' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('handles array header by taking the first element', () => {
    const guard = new IngestTokenGuard(config);
    const ctx = makeContext({ 'x-ingest-token': ['secret-value', 'other'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
