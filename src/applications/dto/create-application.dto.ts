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
