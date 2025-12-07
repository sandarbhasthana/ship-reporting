import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

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
