import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSessionDto {
  @ApiPropertyOptional({ example: 'Supply chain analysis' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    enum: ['mock', 'openai', 'deepseek', 'qwen', 'kimi'],
    default: 'mock',
  })
  @IsOptional()
  @IsIn(['mock', 'openai', 'deepseek', 'qwen', 'kimi'])
  provider?: string;

  @ApiPropertyOptional({ example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  model?: string;
}
