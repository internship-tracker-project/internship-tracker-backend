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
