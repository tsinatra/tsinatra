import {Logger} from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import {
  inject,
  injectable,
} from '../../../inject/src/annotation/InjectorAnnotations';
import {BaseMiddleware} from '../BaseMiddleware';

/**
 * ResponseLoggerMiddleware is a middleware class designed to log responses
 * from an API Gateway HTTP API.
 *
 * The class will log the following information per request:
 *  - The AWS request ID
 *  - The HTTP method
 *  - The request path
 *  - The status code of the response
 *  - The duration of the request in milliseconds
 *
 * The log payload deliberately omits any potential PII from the logs (IP address,
 * user agent, request body, response body).
 *
 * The class expects two parameters:
 * 1. logger: A logger instance from @aws-lambda-powertools
 * 2. nowFn: A function that returns the current time in milliseconds. This is
 *           mostly to facilitate testing; the default value is `Date.now`.
 *
 * @example
 * const logger = Logger.createLogger({name: "FooService"});
 * const responseLoggerMiddleware = new ResponseLoggerMiddleware(logger);
 * const handler = middy(async(event) => ...).use(responseLoggerMiddleware.createMiddleware())
 */
@injectable()
export class ResponseLoggerMiddleware extends BaseMiddleware<
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
> {
  // The start time of the request in milliseconds.
  // Note that `requestStartTime` is protected to allow for testing.
  protected requestStartTime = 0;

  constructor(
    @inject(Logger) private readonly logger: Logger,
    private readonly nowFn: () => number = Date.now
  ) {
    super();
  }

  protected before: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  > = () => {
    // Set the request start time to the current time in milliseconds.
    // This is fine to set and store use across requests since the middleware will only ever
    // be used in a single request at a time.
    this.requestStartTime = this.nowFn();
  };

  protected after: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  > = (
    request: middy.Request<
      APIGatewayProxyEventV2,
      APIGatewayProxyStructuredResultV2,
      Error,
      Context
    >
  ) => {
    // Note that this is an imperfect calculation of the request duration. This is actually the time between
    // the initial call to the 'before' hook and the call to the 'after' hook. This is not the same as the raw
    // handler execution time, but it's close enough for our purposes.
    const requestDuration = this.nowFn() - this.requestStartTime;

    // In AWS SDK 2+, the API Gateway interprets any response that is
    // a string or valid JSON that does not have a statusCode set
    // as a 200.
    // (https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html#http-api-develop-integrations-lambda.response)
    // We set the default response statusCode to be a 200 then check to
    // see if the response object has one explictly set.
    let statusCode = 200;
    if (
      request.response &&
      typeof request.response === 'object' &&
      request.response.statusCode
    ) {
      statusCode = request.response.statusCode;
    }

    this.logger.info('Request complete', {
      responseMetadata: {
        requestId: request.context.awsRequestId,
        method: request.event.requestContext?.http?.method,
        requestDuration: requestDuration,
        path: request.event.requestContext?.http?.path,
        statusCode,
      },
    });
  };
}
