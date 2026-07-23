import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('api/auth')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
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