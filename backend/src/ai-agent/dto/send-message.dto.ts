import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
