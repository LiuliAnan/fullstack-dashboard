import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { aiContext, AiContext } from './ai-context';

export interface AiRequest {
  user: { id: number; email: string };
  ai: AiContext;
  body?: Record<string, unknown>;
}
@Injectable()
export class AiScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AiRequest>();
    req.ai = aiContext(req.user.id);
    if (req.body && !Array.isArray(req.body)) {
      if (
        ['tenantId', 'tenant_id', 'userId', 'user_id', 'actorId'].some(
          (key) => key in req.body!,
        )
      ) {
        throw new BadRequestException('Ownership is assigned by the server');
      }
      if (Object.values(req.body).some((value) => value === null))
        throw new BadRequestException(
          'Top-level null fields are not supported; omit optional fields',
        );
    }
    return true;
  }
}
