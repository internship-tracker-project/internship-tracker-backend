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
