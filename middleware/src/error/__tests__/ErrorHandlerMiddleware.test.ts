import {Logger} from '@aws-lambda-powertools/logger';
import {Metrics} from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';
import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from 'aws-lambda';
import {TsinatraSerializer} from 'serializer';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BadRequestError} from '../../../../errors/src/http/ClientSideError';
import {InternalServerError} from '../../../../errors/src/http/ServerSideError';
import {ValidationError} from '../../../../errors/src/validation/ValidationError';
import {ErrorHandlerMiddleware} from '../ErrorHandlerMiddleware';

describe('ErrorHandlerMiddleware', () => {
  let middleware: ErrorHandlerMiddleware;
  let logger: Logger;
  let metrics: Metrics;

  beforeEach(() => {
    logger = {
      error: vi.fn(),
      critical: vi.fn(),
    } as unknown as Logger;
    metrics = {
      addMetric: vi.fn(),
    } as unknown as Metrics;
    middleware = new ErrorHandlerMiddleware(metrics, logger);
  });

  it('handles an HttpError', () => {
    const {onError} = middleware.createMiddleware();
    const httpError = new BadRequestError('Bad request', {test: 'context'});
    const middyRequest = {
      error: httpError,
    } as unknown as middy.Request<
      APIGatewayProxyEventV2,
      APIGatewayProxyResultV2
    >;

    expect(middyRequest.response).not.toBeDefined();

    onError!(middyRequest);

    expect(middyRequest.response).toBeDefined();
    expect(middyRequest.response).toContain({
      statusCode: httpError.statusCode,
      body: '{"context":{"test":"context"},"errorName":"BadRequest","message":"Bad request","statusCode":400}',
    });
  });

  it('handles a ValidationError', () => {
    const {onError} = middleware.createMiddleware();
    const error = new ValidationError('Validation Error Thrown');
    const badRequestError = new BadRequestError('Validation Error Thrown');
    const middyRequest = {
      error: error,
    } as unknown as middy.Request<
      APIGatewayProxyEventV2,
      APIGatewayProxyResultV2
    >;

    expect(middyRequest.response).not.toBeDefined();

    onError!(middyRequest);

    expect(middyRequest.response).toBeDefined();
    expect(middyRequest.response).toContain({
      statusCode: badRequestError.statusCode,
      body: JSON.stringify(TsinatraSerializer.serialize(badRequestError)),
    });

    expect(logger.error).toHaveBeenCalled();
    expect(metrics.addMetric).toHaveBeenCalled();
  });

  it('handles a generic Error', () => {
    const {onError} = middleware.createMiddleware();
    const error = new Error('Generic error');
    const internalServerError = new InternalServerError('Generic error');
    const middyRequest = {
      error: error,
    } as unknown as middy.Request<
      APIGatewayProxyEventV2,
      APIGatewayProxyResultV2
    >;

    expect(middyRequest.response).not.toBeDefined();

    onError!(middyRequest);

    expect(middyRequest.response).toBeDefined();
    expect(middyRequest.response).toContain({
      statusCode: internalServerError.statusCode,
      body: JSON.stringify(TsinatraSerializer.serialize(internalServerError)),
    });

    expect(logger.error).toHaveBeenCalled();
  });
});
