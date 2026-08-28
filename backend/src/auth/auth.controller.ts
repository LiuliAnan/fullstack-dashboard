import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  LoginResponseDto,
  MeResponseDto,
} from '../common/swagger/api-models';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Validates credentials and returns a JWT access token for authenticated API calls.',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Credentials accepted',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Empty, malformed email, or invalid password length',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Email does not exist or password is incorrect',
  })
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
  @ApiOkResponse({
    type: MeResponseDto,
    description: 'Authenticated JWT payload',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Missing, invalid, or expired JWT',
  })
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return {
      statusCode: 200,
      data: req.user,
    };
  }
}
