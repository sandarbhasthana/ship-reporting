import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { RoleName } from '@ship-reporting/prisma';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(RoleName)
  @IsOptional()
  role?: RoleName;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  assignedVesselId?: string;
}
