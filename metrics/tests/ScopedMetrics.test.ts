import {Metrics, MetricUnits} from '@aws-lambda-powertools/metrics';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Counter} from '../src/Counter';
import {ScopedMetrics} from '../src/ScopedMetrics';

describe('ScopedMetrics', () => {
  let scopedMetrics: ScopedMetrics;
  let metrics: Metrics;
  let singleMetric: Metrics;

  beforeEach(() => {
    singleMetric = {
      addMetric: vi.fn(),
      addDimensions: vi.fn(),
    } as unknown as Metrics;
    metrics = {
      addMetric: vi.fn(),
      addDimensions: vi.fn(),
      singleMetric: () => singleMetric,
    } as unknown as Metrics;

    scopedMetrics = new ScopedMetrics('Name', metrics);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('#scoped', () => {
    it('returns a new scoped metric with the new scope', () => {
      const scoped = scopedMetrics.scope('Subgroup');
      expect(scoped).toStrictEqual(new ScopedMetrics('Name.Subgroup', metrics));
    });
  });

  describe('#counter', () => {
    it('returns a new counter with the scope', () => {
      const counter = scopedMetrics.counter('Requests');
      expect(counter).toStrictEqual(new Counter('Name.Requests', metrics));
    });
  });

  describe('#stopwatch', () => {
    it('returns a new stopwatch with the correct scope', () => {
      const stopwatch = scopedMetrics.stopwatch('Latency');
      expect(stopwatch.stopwatchName).toEqual('Name.Latency');
    });

    it('returns a running stopwatch by default', () => {
      const stopwatch = scopedMetrics.stopwatch('Latency');
      expect(stopwatch.view()).toBeDefined();

      vi.advanceTimersByTime(1560);

      const timeElapsed = stopwatch.stop();
      expect(timeElapsed).toEqual(1560);
      expect(metrics.addMetric).toHaveBeenLastCalledWith(
        'Name.Latency',
        MetricUnits.Milliseconds,
        1560,
        undefined
      );
    });

    it('allow to request a non-started stopwatch', () => {
      const stopwatch = scopedMetrics.stopwatch('Latency', false);
      expect(() => stopwatch.view()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });
  });

  describe('#addDimensions', () => {
    it('creates singleMetric and adds dimensions', () => {
      const scoped = scopedMetrics.addDimensions({dim: 'value'});
      expect(singleMetric.addDimensions).toHaveBeenLastCalledWith({
        dim: 'value',
      });
      expect(scoped).toStrictEqual(new ScopedMetrics('Name', singleMetric));
    });
  });
});
