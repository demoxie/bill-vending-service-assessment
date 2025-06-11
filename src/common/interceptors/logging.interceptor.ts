import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    // Log request
    this.logger.log({
      type: 'REQUEST',
      method,
      url,
      body: this.sanitizeBody(body),
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Log response
          this.logger.log({
            type: 'RESPONSE',
            method,
            url,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: Date.now() - now,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          // Log error
          this.logger.error({
            type: 'ERROR',
            method,
            url,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - now,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;

    return sanitized;
  }
}
