# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev       # Start with hot reload
npm run build           # Compile TypeScript via nest build
npm run test            # Jest unit tests (spec files in src/)
npm run test:e2e        # Supertest e2e tests (test/jest-e2e.json config)
npm run test:watch      # Jest in watch mode
npm run test:cov        # Coverage report
npm run lint            # ESLint + Prettier auto-fix
```

Run a single test file:
```bash
npx jest src/path/to/file.spec.ts
```

## Environment Setup

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Supabase PostgreSQL connection string). The app reads `PORT` at startup (defaults to 3000).

After schema changes:
```bash
npx prisma migrate dev   # Apply migration and regenerate client
npx prisma generate      # Regenerate client only (no migration)
```

## Architecture

The project is scaffolded but feature modules have not been built yet. All application logic still lives in the root `AppModule`. The intended module structure follows NestJS conventions:

- Each feature (auth, applications, analytics) should become its own module under `src/<feature>/`
- Guards, strategies (Passport JWT), and decorators live within the feature module that owns them
- `PrismaService` should be a shared global provider imported where needed

**Prisma client** is generated to `generated/prisma/` (non-default). Import it as:
```ts
import { PrismaClient } from '../generated/prisma';
```

**Auth flow (planned):** JWT access tokens only — no refresh tokens. `passport-jwt` extracts the Bearer token; `@nestjs/jwt` signs and verifies. Passwords hashed with `bcrypt` before storage.

**Validation:** `class-validator` + `class-transformer` are installed. Enable the global `ValidationPipe` in `main.ts` before shipping any endpoint.

**Ownership enforcement:** Every application endpoint must check that the `userId` on the record matches the authenticated user's `id` from the JWT payload — never trust a userId from the request body.
