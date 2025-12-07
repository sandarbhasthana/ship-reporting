import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateVesselDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  imoNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  callSign?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  flag?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  shipFileNo?: string;
}

