import { IsString, IsOptional } from 'class-validator';

export class CreateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  blocksJson?: any; // BlockNote JSON puede ser array u objeto

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  blocksJson?: any; // BlockNote JSON puede ser array u objeto

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class RestoreContentDto {
  @IsString()
  restoredBy: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}
