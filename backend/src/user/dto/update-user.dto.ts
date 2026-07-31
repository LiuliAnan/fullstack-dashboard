import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// PartialType 让 CreateUserDto 的所有字段变成可选，用于更新接口
export class UpdateUserDto extends PartialType(CreateUserDto) {}