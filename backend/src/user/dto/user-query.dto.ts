import { IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/validation/transformers';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Admin,Manager', description: 'Comma-separated roles' })
  @IsOptional()
  @Matches(/^(Admin|Manager|Editor|User)(,(Admin|Manager|Editor|User))*$/, {
    message: 'role contains an unsupported value',
  })
  role?: string;

  @ApiPropertyOptional({ example: 'Jane', description: 'Case-insensitive name search' })
  @IsOptional()
  @Transform(trimString)
  @MaxLength(100)
  search?: string;
}
