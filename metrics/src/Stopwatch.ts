import {
  MetricResolution,
  Metrics,
  MetricUnits,
} from '@aws-lambda-powertools/metrics';

export class Stopwatch {
  private startTime: number | undefined;

  constructor(
    public readonly stopwatchName: string,
    private readonly metrics: Metrics
  ) {}

  public start(): void {
    if (this.startTime) {
      throw new Error('Stapwatch has already started.');
    }
    this.startTime = Date.now();
  }

  public view(): number {
    if (!this.startTime) {
      throw new Error('Stopwatch has not started yet.');
    }

    return Date.now() - this.startTime;
  }

  public track(metricName?: string, resolution?: MetricResolution): number {
    const elapsedTime = this.view();

    this.metrics.addMetric(
      metricName ? `${this.stopwatchName}.${metricName}` : this.stopwatchName,
      MetricUnits.Milliseconds,
      this.view(),
      resolution
    );

    return elapsedTime;
  }

  public stop(resolution?: MetricResolution): number {
    const elapsedTime = this.track(undefined, resolution);

    this.clear();

    return elapsedTime;
  }

  public reset(): void {
    this.startTime = Date.now();
  }

  public clear(): void {
    this.startTime = undefined;
  }
}
