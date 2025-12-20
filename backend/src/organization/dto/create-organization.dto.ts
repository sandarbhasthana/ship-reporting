import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  owner?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  defaultFormNo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  footerText?: string;

  // Admin user credentials for the organization
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  adminPassword!: string;
}
