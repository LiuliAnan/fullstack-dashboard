import { IsEmail, IsString, MinLength, MaxLength, IsIn, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail, trimString } from '../../common/validation/transformers';
import { ApiProperty } from '@nestjs/swagger';

const ROLES = ['Admin', 'Manager', 'Editor', 'User'];
const STATUSES = ['active', 'banned', 'pending'];

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/^\S+$/, { message: 'Password must not contain whitespace' })
  password: string;

  @ApiProperty({ enum: ROLES, example: 'User' })
  @IsIn(ROLES)
  role: string;

  @ApiProperty({ enum: STATUSES, example: 'active' })
  @IsIn(STATUSES)
  status: string;
}
