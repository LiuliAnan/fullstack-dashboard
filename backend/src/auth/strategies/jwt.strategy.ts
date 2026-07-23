import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'my-super-secret-key-change-in-production',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.userService.findByEmail(payload.email);
    if (!user) {
      return null;
    }
    return { id: user.id, email: user.email };
  }
}