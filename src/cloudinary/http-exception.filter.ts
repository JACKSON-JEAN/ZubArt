import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
  } from '@nestjs/common';
  import { GraphQLError } from 'graphql';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        return new GraphQLError(
          typeof response === 'object'
            ? (response as any).message
            : response,
          {
            extensions: {
              code: exception.getStatus(),
              ...(typeof response === 'object' ? response : {}),
            },
          }
        );
      }
      return new GraphQLError('Internal server error', {
        extensions: { code: 500 },
      });
    }
  }