import { IsString, IsOptional } from 'class-validator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
