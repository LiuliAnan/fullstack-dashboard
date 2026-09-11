import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BarChartQueryDto } from '../../dashboard/dto/bar-chart-query.dto';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatAttachmentDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() mimeType: string;
  @ApiProperty() @IsInt() size: number;
  @ApiProperty() @IsString() url: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({
    type: BarChartQueryDto,
    description:
      'Explicit read-only input for calling the existing company aggregation service',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BarChartQueryDto)
  companyQuery?: BarChartQueryDto;
  @ApiProperty() @IsUUID() sessionId: string;
  @ApiProperty({ maxLength: 10000 })
  @IsString()
  @MaxLength(10000)
  message: string;
  @ApiPropertyOptional({ type: [ChatAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
}
