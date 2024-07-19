import {Metrics, MetricUnits} from '@aws-lambda-powertools/metrics';
import {
  MetricResolution,
  MetricUnit,
} from '@aws-lambda-powertools/metrics/lib/types';

export class Counter {
  constructor(
    private readonly metricName: string,
    private readonly metrics: Metrics
  ) {}

  public increment(
    n = 1,
    extra_opts?: {
      resolution?: MetricResolution;
      unit?: MetricUnit;
    }
  ) {
    this.metrics.addMetric(
      this.metricName,
      extra_opts?.unit ?? MetricUnits.Count,
      n,
      extra_opts?.resolution
    );
  }
}
