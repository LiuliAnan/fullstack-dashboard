import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ example: 'Supply chain analysis' })
  @IsOptional()
  @IsString()
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
  @MaxLength(80)
  model?: string;
}
