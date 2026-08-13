import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiConflictResponse({ description: 'Email is already registered' })
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
