# Applications Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full CRUD endpoints for internship applications, guarded by JWT auth, with ownership enforcement so users can only access their own records.

**Architecture:** `ApplicationsModule` follows the same pattern as `AuthModule`. `ApplicationsService` handles all Prisma queries filtered by `userId`. `ApplicationsController` is fully guarded by `JwtAuthGuard` and uses `@CurrentUser()` to inject the authenticated user. DTOs use `class-validator` for input validation. All endpoints enforce ownership — no user can read or mutate another user's applications.

**Tech Stack:** NestJS 11, Prisma 6, class-validator, Jest, existing auth guards/decorators

---

## Complete File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/applications/dto/create-application.dto.ts` | Validate create input |
| Create | `src/applications/dto/update-application.dto.ts` | Validate partial update input |
| Create | `src/applications/applications.service.ts` | CRUD business logic with ownership filtering |
| Create | `src/applications/applications.service.spec.ts` | Service unit tests |
| Create | `src/applications/applications.controller.ts` | HTTP endpoints with auth guard |
| Create | `src/applications/applications.controller.spec.ts` | Controller unit tests |
| Create | `src/applications/applications.module.ts` | Module wiring |
| Modify | `src/app.module.ts` | Import ApplicationsModule |

---

## Task 1: DTOs (Create and Update)

**Files:**
- Create: `src/applications/dto/create-application.dto.ts`
- Create: `src/applications/dto/update-application.dto.ts`

These have no dependencies and can be written first.

- [ ] **Step 1: Write `src/applications/dto/create-application.dto.ts`**

```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../../../generated/prisma';

export class CreateApplicationDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

- [ ] **Step 2: Write `src/applications/dto/update-application.dto.ts`**

```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../../../generated/prisma';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/applications/dto/
git commit -m "feat: add CreateApplicationDto and UpdateApplicationDto with class-validator"
```

---

## Task 2: ApplicationsService (TDD)

**Files:**
- Create: `src/applications/applications.service.spec.ts`
- Create: `src/applications/applications.service.ts`

- [ ] **Step 1: Write the failing tests**

`src/applications/applications.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user-uuid-1';
const otherUserId = 'user-uuid-2';

const mockApplication = {
  id: 'app-uuid-1',
  company: 'Acme Corp',
  role: 'Software Engineer Intern',
  status: 'APPLIED',
  location: 'London',
  notes: null,
  appliedAt: new Date('2026-04-01'),
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  userId,
};

const makePrismaMock = () => ({
  application: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  describe('create', () => {
    it('should create an application for the authenticated user', async () => {
      prisma.application.create.mockResolvedValue(mockApplication);

      const result = await service.create(userId, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });

      expect(prisma.application.create).toHaveBeenCalledWith({
        data: {
          company: 'Acme Corp',
          role: 'Software Engineer Intern',
          location: 'London',
          userId,
        },
      });
      expect(result).toEqual(mockApplication);
    });
  });

  describe('findAll', () => {
    it('should return all applications for the authenticated user', async () => {
      prisma.application.findMany.mockResolvedValue([mockApplication]);

      const result = await service.findAll(userId);

      expect(prisma.application.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockApplication]);
    });

    it('should return empty array when user has no applications', async () => {
      prisma.application.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an application owned by the user', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApplication);

      const result = await service.findOne(mockApplication.id, userId);

      expect(prisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: mockApplication.id, userId },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when application belongs to another user', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockApplication.id, otherUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an application owned by the user', async () => {
      const updated = { ...mockApplication, status: 'INTERVIEW' };
      prisma.application.findUnique.mockResolvedValue(mockApplication);
      prisma.application.update.mockResolvedValue(updated);

      const result = await service.update(mockApplication.id, userId, {
        status: 'INTERVIEW' as any,
      });

      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
        data: { status: 'INTERVIEW' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', userId, { status: 'INTERVIEW' as any }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an application owned by the user', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApplication);
      prisma.application.delete.mockResolvedValue(mockApplication);

      const result = await service.remove(mockApplication.id, userId);

      expect(prisma.application.delete).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest src/applications/applications.service.spec.ts
```
Expected: `FAIL — Cannot find module './applications.service'`

- [ ] **Step 3: Implement `src/applications/applications.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { Application } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateApplicationDto,
  ): Promise<Application> {
    return this.prisma.application.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string): Promise<Application[]> {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Application> {
    const application = await this.prisma.application.findUnique({
      where: { id, userId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    await this.findOne(id, userId);
    return this.prisma.application.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<Application> {
    await this.findOne(id, userId);
    return this.prisma.application.delete({
      where: { id },
    });
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx jest src/applications/applications.service.spec.ts
```
Expected: `PASS — 8 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/applications/applications.service.ts src/applications/applications.service.spec.ts
git commit -m "feat: implement ApplicationsService with CRUD and ownership enforcement"
```

---

## Task 3: ApplicationsController (TDD)

**Files:**
- Create: `src/applications/applications.controller.spec.ts`
- Create: `src/applications/applications.controller.ts`

- [ ] **Step 1: Write the failing tests**

`src/applications/applications.controller.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const user = { sub: 'user-uuid-1', email: 'test@example.com' };

const mockApplication = {
  id: 'app-uuid-1',
  company: 'Acme Corp',
  role: 'Software Engineer Intern',
  status: 'APPLIED',
  location: 'London',
  notes: null,
  appliedAt: new Date('2026-04-01'),
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
  userId: user.sub,
};

const makeServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: ReturnType<typeof makeServiceMock>;

  beforeEach(async () => {
    service = makeServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: service }],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  describe('POST /applications', () => {
    it('should create an application', async () => {
      service.create.mockResolvedValue(mockApplication);

      const result = await controller.create(user, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });

      expect(service.create).toHaveBeenCalledWith(user.sub, {
        company: 'Acme Corp',
        role: 'Software Engineer Intern',
        location: 'London',
      });
      expect(result).toEqual(mockApplication);
    });
  });

  describe('GET /applications', () => {
    it('should return all applications for the user', async () => {
      service.findAll.mockResolvedValue([mockApplication]);

      const result = await controller.findAll(user);

      expect(service.findAll).toHaveBeenCalledWith(user.sub);
      expect(result).toEqual([mockApplication]);
    });
  });

  describe('GET /applications/:id', () => {
    it('should return a single application', async () => {
      service.findOne.mockResolvedValue(mockApplication);

      const result = await controller.findOne(user, mockApplication.id);

      expect(service.findOne).toHaveBeenCalledWith(mockApplication.id, user.sub);
      expect(result).toEqual(mockApplication);
    });

    it('should propagate NotFoundException', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Application not found'),
      );

      await expect(
        controller.findOne(user, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /applications/:id', () => {
    it('should update an application', async () => {
      const updated = { ...mockApplication, status: 'INTERVIEW' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(user, mockApplication.id, {
        status: 'INTERVIEW' as any,
      });

      expect(service.update).toHaveBeenCalledWith(
        mockApplication.id,
        user.sub,
        { status: 'INTERVIEW' },
      );
      expect(result).toEqual(updated);
    });
  });

  describe('DELETE /applications/:id', () => {
    it('should delete an application', async () => {
      service.remove.mockResolvedValue(mockApplication);

      const result = await controller.remove(user, mockApplication.id);

      expect(service.remove).toHaveBeenCalledWith(mockApplication.id, user.sub);
      expect(result).toEqual(mockApplication);
    });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest src/applications/applications.controller.spec.ts
```
Expected: `FAIL — Cannot find module './applications.controller'`

- [ ] **Step 3: Implement `src/applications/applications.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Application } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateApplicationDto,
  ): Promise<Application> {
    return this.applicationsService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<Application[]> {
    return this.applicationsService.findAll(user.sub);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Application> {
    return this.applicationsService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<Application> {
    return this.applicationsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<Application> {
    return this.applicationsService.remove(id, user.sub);
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx jest src/applications/applications.controller.spec.ts
```
Expected: `PASS — 6 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/applications/applications.controller.ts src/applications/applications.controller.spec.ts
git commit -m "feat: implement ApplicationsController with JWT-guarded CRUD endpoints"
```

---

## Task 4: Module Wiring

**Files:**
- Create: `src/applications/applications.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write `src/applications/applications.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
```

- [ ] **Step 2: Update `src/app.module.ts`**

Add `ApplicationsModule` to imports. The file should become:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --runInBand
```
Expected: All test suites pass (app.controller, prisma.service, auth.service, auth.controller, applications.service, applications.controller).

- [ ] **Step 4: Run build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/applications/applications.module.ts src/app.module.ts
git commit -m "feat: wire ApplicationsModule into AppModule"
```

---

## Task 5: Verification — Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run start:dev
```
Expected: Server starts, routes mapped for `/applications` (POST, GET, GET/:id, PATCH/:id, DELETE/:id).

- [ ] **Step 2: Register/login to get a JWT**

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com","password":"strongpass1234"}'
```
Save the `access_token` from the response.

- [ ] **Step 3: Create an application**

```bash
curl -s -X POST http://localhost:3000/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"company":"Google","role":"SWE Intern","location":"London"}'
```
Expected: 201 with the created application object.

- [ ] **Step 4: List all applications**

```bash
curl -s http://localhost:3000/applications \
  -H "Authorization: Bearer <TOKEN>"
```
Expected: 200 with array containing the created application.

- [ ] **Step 5: Get single application**

```bash
curl -s http://localhost:3000/applications/<APP_ID> \
  -H "Authorization: Bearer <TOKEN>"
```
Expected: 200 with the application object.

- [ ] **Step 6: Update application status**

```bash
curl -s -X PATCH http://localhost:3000/applications/<APP_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"status":"INTERVIEW"}'
```
Expected: 200 with updated application (status = INTERVIEW).

- [ ] **Step 7: Delete application**

```bash
curl -s -X DELETE http://localhost:3000/applications/<APP_ID> \
  -H "Authorization: Bearer <TOKEN>"
```
Expected: 200 with deleted application object.

- [ ] **Step 8: Test auth enforcement**

```bash
curl -s http://localhost:3000/applications
```
Expected: 401 Unauthorized (no token).

- [ ] **Step 9: Test validation**

```bash
curl -s -X POST http://localhost:3000/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"company":"Google"}'
```
Expected: 400 with "role must be a string" validation error.

- [ ] **Step 10: Test invalid status enum**

```bash
curl -s -X PATCH http://localhost:3000/applications/<APP_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"status":"INVALID"}'
```
Expected: 400 with enum validation error.

- [ ] **Step 11: Push and open PR**

```bash
git push -u origin feature/applications-module
gh pr create --base dev --title "feat: applications module (CRUD with JWT auth)" --body "..."
```
