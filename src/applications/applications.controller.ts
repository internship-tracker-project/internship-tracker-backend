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
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
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
