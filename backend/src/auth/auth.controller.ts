import { Controller, Post, Get, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiBearerAuth('access-token')
  @ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired JWT' })
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return {
      statusCode: 200,
      data: req.user,
    };
  }
}
