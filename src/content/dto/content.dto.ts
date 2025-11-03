import { IsString, IsOptional } from 'class-validator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  blocksJson?: any; // BlockNote JSON puede ser array u objeto
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  blocksJson?: any; // BlockNote JSON puede ser array u objeto
}
