import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateEntryDto } from './create-entry.dto';

export class CreateInspectionDto {
  @ApiPropertyOptional({
    description: 'Vessel ID (auto-populated for Captains)',
  })
  @IsString()
  @IsOptional()
  vesselId?: string;

  @ApiPropertyOptional({
    description: 'Report title',
    default: 'THIRD PARTY DEFICIENCY SUMMARY',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Ship file number (overrides vessel default)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  shipFileNo?: string;

  @ApiPropertyOptional({ description: 'Office file number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  officeFileNo?: string;

  @ApiPropertyOptional({ description: 'Revision number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  revisionNo?: string;

  @ApiPropertyOptional({ description: 'Form number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  formNo?: string;

  @ApiPropertyOptional({ description: 'Applicable FOM sections' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  applicableFomSections?: string;

  @ApiPropertyOptional({ description: 'Inspected by (e.g., RIGHTSHIP)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  inspectedBy?: string;

  @ApiPropertyOptional({ description: 'Inspection date' })
  @IsDateString()
  @IsOptional()
  inspectionDate?: string;

  @ApiPropertyOptional({
    description: 'Inspection entries',
    type: [CreateEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  @IsOptional()
  entries?: CreateEntryDto[];
}
