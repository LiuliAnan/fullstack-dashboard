import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/validation/transformers';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(50)
  @Matches(/^\S+$/, { message: 'Password must not contain whitespace' })
  password: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MaxLength(50)
  confirmPassword: string;
}
