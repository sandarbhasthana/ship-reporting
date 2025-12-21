import { IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

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
}
