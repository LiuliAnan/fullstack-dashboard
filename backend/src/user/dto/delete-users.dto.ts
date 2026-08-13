import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUsersDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3], uniqueItems: true })
  @IsArray({ message: 'ids must be an array' })
  @ArrayNotEmpty({ message: 'ids must contain at least one user id' })
  @ArrayUnique({ message: 'ids must not contain duplicates' })
  @IsInt({ each: true, message: 'each user id must be an integer' })
  @Min(1, { each: true, message: 'each user id must be a positive integer' })
  ids: number[];
}
