import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
export class UserManageController {
  constructor(private userService: UserService) {}

  // 列表（带过滤）：GET /api/users?role=Admin,Manager&search=张
  @Get()
  findAll(@Query('role') role?: string, @Query('search') search?: string) {
    return this.userService.findAll({ role, search });
  }

  // 单个用户：GET /api/users/5
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOneById(id);
  }

  // 创建：POST /api/users
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.userService.createWithProfile(dto);
  }

  // 更新：PATCH /api/users/5
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  // 批量删除：DELETE /api/users  body: { ids: [1,2,3] }
  @Delete()
  removeMany(@Body('ids') ids: number[]) {
    return this.userService.removeUsers(ids);
  }

  // 删除单个：DELETE /api/users/5
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeUser(id);
  }
}