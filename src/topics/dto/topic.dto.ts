import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['content', 'evaluation'])
  type?: 'content' | 'evaluation';
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['content', 'evaluation'])
  type?: 'content' | 'evaluation';
}
