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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUsersDto } from './dto/delete-users.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  DeleteUserDto,
  DeleteUsersResultDto,
  ErrorResponseDto,
  PaginatedUsersDto,
  UserViewDto,
} from '../common/swagger/api-models';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Missing, invalid, or expired JWT',
})
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UserManageController {
  constructor(private userService: UserService) {}

  // 列表（带过滤）：GET /api/users?role=Admin,Manager&search=张
  @Get()
  @ApiOperation({
    summary: 'List users with pagination, role filter, and name search',
  })
  @ApiOkResponse({ type: PaginatedUsersDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid pagination, role, or search query',
  })
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  // 单个用户：GET /api/users/5
  @Get(':id')
  @ApiOperation({ summary: 'Get one user' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Positive integer user ID',
  })
  @ApiOkResponse({ type: UserViewDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'ID is not an integer',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'User not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOneById(id);
  }

  // 创建：POST /api/users
  @Post()
  @ApiOperation({ summary: 'Create a user and profile' })
  @ApiCreatedResponse({ type: UserViewDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Empty or invalid user fields',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already registered',
  })
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.userService.createWithProfile(dto);
  }

  // 更新：PATCH /api/users/5
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user and profile' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Positive integer user ID',
  })
  @ApiOkResponse({ type: UserViewDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid ID or update fields',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already registered',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'User not found',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  // 批量删除：DELETE /api/users  body: { ids: [1,2,3] }
  @Delete()
  @ApiOperation({ summary: 'Delete multiple users' })
  @ApiOkResponse({ type: DeleteUsersResultDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'IDs must be a non-empty array of unique positive integers',
  })
  removeMany(@Body() dto: DeleteUsersDto) {
    return this.userService.removeUsers(dto.ids);
  }

  // 删除单个：DELETE /api/users/5
  @Delete(':id')
  @ApiOperation({ summary: 'Delete one user' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Positive integer user ID',
  })
  @ApiOkResponse({ type: DeleteUserDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'ID is not an integer',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'User not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeUser(id);
  }
}
