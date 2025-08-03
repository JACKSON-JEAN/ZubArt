import {
    Injectable,
    UnauthorizedException,
    ExecutionContext,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { JwtService } from '@nestjs/jwt';
  import { GqlExecutionContext } from '@nestjs/graphql';
  import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class JwtGuard extends AuthGuard('jwt') {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) {
      super();
    }
  
    getRequest(context: ExecutionContext) {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;
      return request;
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = this.getRequest(context);
      const token = this.extractTokenFromHeader(request);
  
      if (!token) {
        throw new UnauthorizedException('Authorization token is missing.');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('JWT_SECRET')
        });
        // Attach the user payload to the request
        request.user = payload;
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // Specific error for token expiration
          throw new UnauthorizedException('Token expired');
        } else {
          // Generic error for other token issues
          throw new UnauthorizedException('Invalid token');
        }
      }
  
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
  