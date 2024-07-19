import {Logger} from '@aws-lambda-powertools/logger';
import {
  MetricResolution,
  Metrics,
  MetricUnits,
} from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';
import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from 'aws-lambda';
import {BadRequestError} from '../../../errors/src/http/ClientSideError';
import {HttpError} from '../../../errors/src/http/HttpError';
import {InternalServerError} from '../../../errors/src/http/ServerSideError';
import {ValidationError} from '../../../errors/src/validation/ValidationError';
import {
  inject,
  injectable,
} from '../../../inject/src/annotation/InjectorAnnotations';
import {TsinatraSerializer} from '../../../serializer/src/TsinatraSerializer';
import {BaseMiddleware} from '../BaseMiddleware';

/**
 * Middleware that handles errors thrown by the lambda.
 * Any error thrown of type {@link HttpError} will be automatically converted to JSON.
 * Any error thrown of type {@link Error} will be automatically converted to an {@link InternalServerError}
 * Any error thrown of an unknown type will be automatically converted to an {@link InternalServerError}
 */

@injectable()
export class ErrorHandlerMiddleware extends BaseMiddleware<
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
> {
  constructor(
    @inject(Metrics) private readonly metrics: Metrics,
    @inject(Logger) private readonly logger: Logger
  ) {
    super();
  }

  protected onError = (
    request: middy.Request<APIGatewayProxyEventV2, APIGatewayProxyResultV2>
  ): void => {
    const {error} = request;
    let httpError: HttpError;

    if (error instanceof Error) {
      this.logger.error(error.message, {error}, {event: request.event});
      this.metrics.addMetric(
        `Error.${error.constructor.name}`,
        MetricUnits.Count,
        1
      );
    }

    if (error instanceof HttpError) {
      httpError = error;
    } else if (error instanceof ValidationError) {
      httpError = new BadRequestError(error.message);
    } else if (error instanceof Error) {
      httpError = new InternalServerError(error.message);
    } else {
      this.logger.error('Unhandled error', {error});
      httpError = new InternalServerError(`Unhandled error: ${error}`);
    }

    request.response = {
      statusCode: httpError.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TsinatraSerializer.serialize(httpError)),
    };
  };
}
