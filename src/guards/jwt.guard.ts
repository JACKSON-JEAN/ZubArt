import {
    Injectable,
    UnauthorizedException,
    ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        return ctx.getContext().req;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = this.getRequest(context);
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Authorization token missing');
        }

        try {
            const canActivate = await (super.canActivate(context) as Promise<boolean>);
            const payload = this.getRequest(context).user;
            
            if (!payload) {
                throw new UnauthorizedException('Invalid token payload');
            }

            return canActivate;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log(error)
                throw new UnauthorizedException('Session expired. Please login again.');
            }
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}