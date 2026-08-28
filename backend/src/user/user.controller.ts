import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign-up.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  SignupResponseDto,
} from '../common/swagger/api-models';

@ApiTags('Auth')
@Controller('api/auth')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: SignupResponseDto,
    description: 'User registered successfully',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Empty fields, invalid format, or passwords do not match',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email is already registered',
  })
  @HttpCode(201)
  async signUp(@Body() dto: SignUpDto) {
    const user = await this.userService.create(dto);
    return {
      statusCode: 201,
      message: 'User registered successfully',
      data: user,
    };
  }
}
