import {Metrics, MetricUnits} from '@aws-lambda-powertools/metrics';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Stopwatch} from '../src/Stopwatch';

describe('Stopwatch', () => {
  let stopwatch: Stopwatch;
  let metrics: Metrics;

  beforeEach(() => {
    metrics = {
      addMetric: vi.fn(),
    } as unknown as Metrics;

    stopwatch = new Stopwatch('Latency', metrics);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('#view', () => {
    it('throws an error when the stopwatch has not started', () => {
      expect(() => stopwatch.view()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });

    it('returns the time so far once the stopwatch starts', () => {
      stopwatch.start();
      expect(stopwatch.view()).toEqual(0);
      vi.advanceTimersByTime(1000);
      expect(stopwatch.view()).toEqual(1000);
    });
  });

  describe('#start', () => {
    it('tracks the time when the stopwatch starts', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      expect(stopwatch.view()).toEqual(0);
      vi.advanceTimersByTime(1000);
      expect(stopwatch.view()).toEqual(1000);
    });

    it('throws an error when trying to start the stopwatch after it has been started', () => {
      stopwatch.start();
      expect(() => stopwatch.start()).toThrowError(
        'Stapwatch has already started.'
      );
    });
  });

  describe('#track', () => {
    it('throws an error when trying to track the time before the stopwatch is started', () => {
      expect(() => stopwatch.track()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });

    it('records the metric and returns the elapsed time when called', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      expect(stopwatch.track()).toEqual(0);
      expect(metrics.addMetric).toHaveBeenLastCalledWith(
        'Latency',
        MetricUnits.Milliseconds,
        0,
        undefined
      );

      vi.advanceTimersByTime(1000);
      expect(stopwatch.track()).toEqual(1000);
      expect(metrics.addMetric).toHaveBeenLastCalledWith(
        'Latency',
        MetricUnits.Milliseconds,
        1000,
        undefined
      );
    });

    it('records the metric, with the added name, and returns the elapsed time when called', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(1420);
      expect(stopwatch.track('Part1')).toEqual(1420);

      expect(metrics.addMetric).toHaveBeenLastCalledWith(
        'Latency.Part1',
        MetricUnits.Milliseconds,
        1420,
        undefined
      );
    });
  });

  describe('#stop', () => {
    it('throws an error when trying to stop the stopwatch before it has started', () => {
      expect(() => stopwatch.stop()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });

    it('records the metric and returns the elapsed time when called', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(510);
      expect(stopwatch.stop()).toEqual(510);
      expect(metrics.addMetric).toHaveBeenLastCalledWith(
        'Latency',
        MetricUnits.Milliseconds,
        510,
        undefined
      );
    });

    it('throws an error if we try to stop after it is stopped, since it resets the stopwatch', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(1420);
      expect(stopwatch.stop()).toEqual(1420);

      expect(() => stopwatch.stop()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });

    it('can be used again, once it is stopped', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(1420);
      expect(stopwatch.stop()).toEqual(1420);

      stopwatch.start();
      vi.advanceTimersByTime(224);
      expect(stopwatch.stop()).toEqual(224);
    });
  });

  describe('#reset', () => {
    it('resets the stopwatch', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(510);
      expect(stopwatch.view()).toEqual(510);
      stopwatch.reset();
      expect(stopwatch.view()).toEqual(0);
      vi.advanceTimersByTime(510);
      expect(stopwatch.view()).toEqual(510);
    });
  });

  describe('#clear', () => {
    it('clears the stopwatch to the pre-started state', () => {
      // We don't have access to the time, so we can measure it by using the viewTime function.
      stopwatch.start();
      vi.advanceTimersByTime(510);
      expect(stopwatch.view()).toEqual(510);
      stopwatch.clear();
      expect(() => stopwatch.view()).toThrowError(
        'Stopwatch has not started yet.'
      );
    });
  });
});
