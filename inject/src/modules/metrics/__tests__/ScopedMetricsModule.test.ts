import {Metrics} from '@aws-lambda-powertools/metrics';
import {Container, inject, injectable} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ScopedMetrics} from '../../../../../metrics/src/ScopedMetrics';
import {LambdaBinding} from '../../../bindings/LambdaBinding';
import {ScopedMetricsModule} from '../ScopedMetricsModule';

@injectable()
class TestingClassInjection {
  constructor(
    @inject(ScopedMetrics)
    public readonly scopedMetrics: ScopedMetrics
  ) {}
}

describe('ScopedMetricsModule', () => {
  let container: Container;
  let metrics: Metrics;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    metrics = {addMetric: vi.fn()} as unknown as Metrics;
    container.bind(Container).toConstantValue(container);
    container.bind(LambdaBinding.Name).toConstantValue('LambdaName');
    container.bind(Metrics).toConstantValue(metrics);
  });

  describe('with all required env variables', () => {
    beforeEach(() => {
      const scopedMetricsModule = container.get(ScopedMetricsModule);
      scopedMetricsModule.configure();
    });

    it('correctly binds a scoped metric and returns the LambdaName', () => {
      const scopedMetrics = container.get(ScopedMetrics);

      expect(scopedMetrics).toBeDefined();
      expect(scopedMetrics.constructor.name).toEqual('ScopedMetrics');
      expect(scopedMetrics.scopedName).toEqual('LambdaName');
    });

    it('correctly binds a scoped metric using the name of the it', () => {
      const scopedMetrics = container.getNamed(ScopedMetrics, 'MetricName');

      expect(scopedMetrics).toBeDefined();
      expect(scopedMetrics.constructor.name).toEqual('ScopedMetrics');
      expect(scopedMetrics.scopedName).toEqual('MetricName');
    });

    it('correctly binds the scoped metric name when injected in a class', () => {
      const testInjection = container.get(TestingClassInjection);

      expect(testInjection.scopedMetrics).toBeDefined();
      expect(testInjection.scopedMetrics.constructor.name).toEqual(
        'ScopedMetrics'
      );
      expect(testInjection.scopedMetrics.scopedName).toEqual(
        'TestingClassInjection'
      );
    });
  });
});
