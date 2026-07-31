import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

const ROLES = ['Admin', 'Manager', 'Editor', 'User'];
const STATUSES = ['active', 'banned', 'pending'];

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(ROLES)
  role: string;

  @IsIn(STATUSES)
  status: string;
}