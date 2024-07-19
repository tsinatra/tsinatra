import {HttpError} from './HttpError';

export class ClientSideError extends HttpError {
  protected constructor(
    statusCode: number,
    errorName: string,
    message?: string,
    context?: unknown
  ) {
    super(statusCode, errorName, message, context);
  }
}
export class BadRequestError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(400, 'BadRequest', message, context);
  }
}
export class UnauthorizedError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(401, 'Unauthorized', message, context);
  }
}
export class ForbiddenError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(403, 'Forbidden', message, context);
  }
}
export class NotFoundError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(404, 'NotFound', message, context);
  }
}
export class RequestTimeoutError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(408, 'RequestTimeout', message, context);
  }
}
export class UnprocessableEntityError extends ClientSideError {
  constructor(message?: string, context?: unknown) {
    super(422, 'UnprocessableEntity', message, context);
  }
}
