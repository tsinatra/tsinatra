import {HttpError} from './HttpError';

export class ServerSideError extends HttpError {
  protected constructor(
    statusCode: number,
    errorName: string,
    message?: string,
    context?: unknown
  ) {
    super(statusCode, errorName, message, context);
  }
}
export class InternalServerError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(500, 'InternalServerError', message, context);
  }
}
export class NotImplementedError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(501, 'NotImplemented', message, context);
  }
}
export class BadGatewayError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(502, 'BadGateway', message, context);
  }
}
export class ServiceUnavailableError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(503, 'ServiceUnavailable', message, context);
  }
}
export class ConnectionTimedOutError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(522, 'ConnectionTimedOut', message, context);
  }
}
export class ATimeoutOccurredError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(524, 'ATimeoutOccurred', message, context);
  }
}
export class InvalidSSLCertificateError extends ServerSideError {
  constructor(message?: string, context?: unknown) {
    super(526, 'InvalidSSLCertificate', message, context);
  }
}
