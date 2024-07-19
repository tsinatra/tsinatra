import {Metrics} from '@aws-lambda-powertools/metrics';
import {Counter} from './Counter';
import {Stopwatch} from './Stopwatch';

export class ScopedMetrics {
  constructor(
    public readonly scopedName: string,
    private readonly metrics: Metrics
  ) {}

  public scope(scopeName: string): ScopedMetrics {
    return new ScopedMetrics(`${this.scopedName}.${scopeName}`, this.metrics);
  }

  public counter(name: string): Counter {
    return new Counter(`${this.scopedName}.${name}`, this.metrics);
  }

  public stopwatch(name: string, start = true): Stopwatch {
    const stopwatch = new Stopwatch(`${this.scopedName}.${name}`, this.metrics);
    if (start) stopwatch.start();
    return stopwatch;
  }

  public addDimensions(dimensions: {[key: string]: string}): ScopedMetrics {
    const singleMetric = this.metrics.singleMetric();
    singleMetric.addDimensions(dimensions);
    return new ScopedMetrics(this.scopedName, singleMetric);
  }
}
