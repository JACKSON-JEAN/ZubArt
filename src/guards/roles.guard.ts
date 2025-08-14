import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
          context.getHandler(),
          context.getClass(),
      ]);

      if (!requiredRoles) return true;

      const ctx = GqlExecutionContext.create(context);
      const user = ctx.getContext().req.user;
      
      if (!requiredRoles.includes(user?.role)) {
          throw new ForbiddenException(
              `Required roles: ${requiredRoles.join(', ')}. Your role: ${user?.role || 'none'}`
          );
      }

      return true;
  }
}