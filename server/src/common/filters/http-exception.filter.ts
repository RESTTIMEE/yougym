import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;

      if (status >= 500) {
        this.logger.error({ status, message, path: request.url, stack: exception.stack });
      } else {
        this.logger.warn({ status, message, path: request.url });
      }
    } else {
      // Prisma / unknown error — sanitize client response, log full details
      this.logger.error({
        error: String(exception),
        path: request.url,
        stack: (exception as Error).stack,
      });
    }

    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      data: null,
    });
  }
}
