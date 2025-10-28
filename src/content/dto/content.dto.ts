import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  blocksJson?: any;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  blocksJson?: any;
}
