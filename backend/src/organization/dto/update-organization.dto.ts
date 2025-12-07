import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

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

