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
      // Get the required roles from the @Roles decorator
      const requiredRoles = this.reflector.get<string[]>(
        'roles',
        context.getHandler(),
      );
  
      // If no roles are required, allow access
      if (!requiredRoles) {
        return true;
      }
  
      // Extract the user from the request
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;
      const user = request.user;
  
      // Check if the user has the required role
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Unauthorized: Insufficient permissions');
      }
  
      return true;
    }
  }
  