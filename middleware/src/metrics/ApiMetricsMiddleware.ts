import {
  MetricResolution,
  Metrics,
  MetricUnits,
} from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  inject,
  injectable,
} from '../../../inject/src/annotation/InjectorAnnotations';
import {BaseMiddleware} from '../BaseMiddleware';

@injectable()
export class ApiMetricsMiddleware extends BaseMiddleware<
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
> {
  // The start time of the request in milliseconds.
  // Note that `requestStartTime` is protected to allow for testing.
  protected requestStartTime = 0;

  constructor(@inject(Metrics) private readonly metrics: Metrics) {
    super();
  }

  protected before: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  > = () => {
    // For tracking latencies.
    this.requestStartTime = Date.now();
    this.metrics.captureColdStartMetric();
  };

  protected after: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  > = request => {
    this.trackAfterOrErrorMetrics(request);
  };

  protected onError: middy.MiddlewareFn<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  > = request => {
    // This Middleware should run after the `ErrorHandlerMiddleware` which should catch any error and
    // convert into an appropriate response. We should be good to check the status code.
    this.trackAfterOrErrorMetrics(request);
  };

  private trackAfterOrErrorMetrics(
    request: middy.Request<
      APIGatewayProxyEventV2,
      APIGatewayProxyStructuredResultV2
    >
  ): void {
    // Track the number of requests. We do this in the `after` path to log the metric at the same time as the status.
    this.metrics.addMetric('Request', MetricUnits.Count, 1);

    // Track statusCode metrics
    if (request.response?.statusCode) {
      this.trackResponseStatusMetric(request.response?.statusCode);
    }

    // Tracks the latency of this call
    this.metrics.addMetric(
      'Latency',
      MetricUnits.Milliseconds,
      Date.now() - this.requestStartTime
    );

    this.metrics.publishStoredMetrics();
  }

  private trackResponseStatusMetric(statusCode: number): void {
    let statusMetric: string;
    if (statusCode >= 200 && statusCode < 300) {
      statusMetric = 'Success';
    } else if (statusCode >= 300 && statusCode < 400) {
      statusMetric = 'Redirect';
    } else if (statusCode >= 400 && statusCode < 500) {
      statusMetric = 'ClientError';
    } else {
      statusMetric = 'ServerError';
    }

    this.metrics.addMetric(statusMetric, MetricUnits.Count, 1);
  }
}
