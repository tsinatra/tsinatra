import {
  MetricResolution,
  Metrics,
  MetricUnits,
} from '@aws-lambda-powertools/metrics';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Counter} from '../src/Counter';

describe('Counter', () => {
  let counter: Counter;
  let metrics: Metrics;

  beforeEach(() => {
    metrics = {
      addMetric: vi.fn(),
    } as unknown as Metrics;

    counter = new Counter('Test', metrics);
  });

  describe('#increment', () => {
    it('adds the default attributes to the metrics', () => {
      counter.increment();

      expect(metrics.addMetric).toHaveBeenCalledWith(
        'Test',
        MetricUnits.Count,
        1,
        undefined
      );
    });

    it('adds the n value to the metrics', () => {
      counter.increment(5);

      expect(metrics.addMetric).toHaveBeenCalledWith(
        'Test',
        MetricUnits.Count,
        5,
        undefined
      );
    });

    it('adds the n value to the metrics, with the proper resolution', () => {
      counter.increment(10, {resolution: MetricResolution.High});

      expect(metrics.addMetric).toHaveBeenCalledWith(
        'Test',
        MetricUnits.Count,
        10,
        MetricResolution.High
      );
    });

    it('allows to define a custom metric unit', () => {
      counter.increment(10, {
        resolution: MetricResolution.Standard,
        unit: MetricUnits.Bits,
      });

      expect(metrics.addMetric).toHaveBeenCalledWith(
        'Test',
        MetricUnits.Bits,
        10,
        MetricResolution.Standard
      );
    });

    it('allows to define a custom metric unit only', () => {
      counter.increment(10, {
        unit: MetricUnits.Bits,
      });

      expect(metrics.addMetric).toHaveBeenCalledWith(
        'Test',
        MetricUnits.Bits,
        10,
        undefined
      );
    });
  });
});
