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

**Prisma client** is generated to `generated/prisma/` (non-default). Import it with a relative path adjusted for the file's location, e.g. from `src/`:
```ts
import { PrismaClient } from '../generated/prisma';
```
From a nested directory like `src/auth/`, use `../../generated/prisma`.

**Auth flow (planned):** JWT access tokens only — no refresh tokens. `passport-jwt` extracts the Bearer token; `@nestjs/jwt` signs and verifies. Passwords hashed with `bcrypt` before storage.

**Validation:** `class-validator` + `class-transformer` are installed. Enable the global `ValidationPipe` in `main.ts` before shipping any endpoint.

**Ownership enforcement:** Every application endpoint must check that the `userId` on the record matches the authenticated user's `id` from the JWT payload — never trust a userId from the request body.

## Git Workflow

### Session Start
At the start of every conversation, check the current branch with `git branch --show-current`. If on `main` or `dev`, ask the user what they are working on and create a new branch from `dev` using the appropriate prefix and a short kebab-case description:

- `feature/` — new functionality
- `fix/` — bug fix
- `chore/` — maintenance, dependencies, config
- `docs/` — documentation only
- `refactor/` — restructuring without behaviour change
- `test/` — adding or updating tests
- `hotfix/` — urgent fix

Always branch from `dev`:
```bash
git checkout dev && git pull && git checkout -b <prefix>/<short-description>
```

### Opening a PR
When the user says to open a PR (e.g. "open PR", "ship it"):
1. Stage and commit any uncommitted changes
2. Push the branch to GitHub
3. Create a PR targeting `dev` with an auto-generated title and summary

### After a PR is Merged
When the user says "PR merged":
1. Check GitHub with `gh pr list --state merged --limit 5` to verify the PR was merged
2. Switch to `dev` and pull latest: `git checkout dev && git pull`
3. Ask the user what they are working on next and create a new branch from `dev` using the prefixes above
