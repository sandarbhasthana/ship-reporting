import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionStatus } from '@ship-reporting/prisma';

export class CreateEntryDto {
  // === SHIP STAFF Fields (Captain + Admin editable) ===

  @ApiProperty({ description: 'Serial number (max 5 chars)' })
  @IsString()
  @MaxLength(5)
  srNo!: string;

  @ApiProperty({ description: 'Deficiency description (max 1000 chars)' })
  @IsString()
  @MaxLength(1000)
  deficiency!: string;

  @ApiPropertyOptional({
    description: "Master's cause analysis (max 1000 chars)",
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  mastersCauseAnalysis?: string;

  @ApiPropertyOptional({ description: 'Corrective action (max 1000 chars)' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  correctiveAction?: string;

  @ApiPropertyOptional({ description: 'Preventive action (max 1000 chars)' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  preventiveAction?: string;

  @ApiPropertyOptional({ description: 'Completion date' })
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  // === OFFICE Fields (Admin only) ===

  @ApiPropertyOptional({
    description: 'Company analysis (Admin only, max 1000 chars)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  companyAnalysis?: string;

  @ApiPropertyOptional({
    description: 'Status (Admin only)',
    enum: InspectionStatus,
    default: InspectionStatus.OPEN,
  })
  @IsEnum(InspectionStatus)
  @IsOptional()
  status?: InspectionStatus;

  @ApiPropertyOptional({ description: 'Office sign user ID (Admin only)' })
  @IsString()
  @IsOptional()
  officeSignUserId?: string;

  @ApiPropertyOptional({ description: 'Office sign date (Admin only)' })
  @IsDateString()
  @IsOptional()
  officeSignDate?: string;
}
