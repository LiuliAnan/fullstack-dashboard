import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CreateSessionDto } from './create-session.dto';

export class AiQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
  @ApiPropertyOptional({
    description:
      'Own user ID only; tenant admins may filter audit logs by another member',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}
export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @ApiPropertyOptional({ enum: ['active', 'closed'] })
  @IsOptional()
  @IsIn(['active', 'closed'])
  status?: string;
}
export class CreateMemoryDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(40)
  kind: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(120)
  key: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  value: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
export class UpdateMemoryDto extends PartialType(CreateMemoryDto) {}
export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  type: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() sessionId?: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;
}
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['pending', 'running', 'completed', 'failed', 'cancelled'])
  status?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  errorSummary?: string;
}
export class CreateAuditDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  action: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(80)
  resource: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() resourceId?: string;
  @ApiProperty({ enum: ['success', 'failure'] })
  @IsIn(['success', 'failure'])
  outcome: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
export class AuditCorrectionDto {
  @ApiProperty({
    description: 'Required reason; original event fields remain immutable',
  })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(1000)
  reason: string;
}
export class TaskStateDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  state: Record<string, unknown>;
  @ApiPropertyOptional({ default: 7200, minimum: 1, maximum: 604800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(604800)
  ttlSeconds?: number;
}
