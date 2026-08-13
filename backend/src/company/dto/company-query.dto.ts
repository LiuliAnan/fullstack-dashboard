import { IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/validation/transformers';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '1,2', description: 'Comma-separated levels from 1 to 4' })
  @IsOptional()
  @Matches(/^[1-4](,[1-4])*$/, { message: 'level must contain values from 1 to 4' })
  level?: string;

  @ApiPropertyOptional({ example: 'Doyle', description: 'Case-insensitive company name search' })
  @IsOptional()
  @Transform(trimString)
  @MaxLength(200)
  search?: string;
}
