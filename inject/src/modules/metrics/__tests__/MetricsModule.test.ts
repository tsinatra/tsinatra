import {Metrics} from '@aws-lambda-powertools/metrics';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingRequiredEnvError} from '../../../../../errors/src/validation/lambda/MissingRequiredEnvError';
import {LambdaBinding} from '../../../bindings/LambdaBinding';
import {EnvModule} from '../../lambda/EnvModule';
import {MetricsModule} from '../MetricsModule';

describe('MetricsModule', () => {
  let container: Container;

  beforeEach(() => {
    vi.unstubAllEnvs();
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    container.bind(LambdaBinding.Name).toConstantValue('LambdaName');

    const envModule = container.get(EnvModule);
    envModule.configure();
  });

  describe('with all required env variables', () => {
    beforeEach(() => {
      vi.stubEnv('SERVICE_NAME', 'MetricsTest');
      vi.stubEnv('METRICS_NAMESPACE', 'Tsinatra');

      const metricsModule = container.get(MetricsModule);
      metricsModule.configure();
    });

    it('correctly binds a metrics', () => {
      const metrics = container.get(Metrics);

      expect(metrics).toBeDefined();
    });

    it('correctly binds the serviceName', () => {
      const metrics = container.get(Metrics);
      const serializedMetrics = metrics.serializeMetrics();

      expect(serializedMetrics['service']).toEqual('MetricsTest');
    });

    it('correctly binds the namespace', () => {
      const metrics = container.get(Metrics);
      const serializedMetrics = metrics.serializeMetrics();

      expect(
        serializedMetrics['_aws']['CloudWatchMetrics'][0]['Namespace']
      ).toEqual('Tsinatra');
    });
  });

  describe('when required env variables are missing', () => {
    it('fails to create an instance of metrics when SERVICE_NAME is not defined', () => {
      vi.stubEnv('METRICS_NAMESPACE', 'Tsinatra');

      expect(() => container.get(MetricsModule)).toThrowError(
        new MissingRequiredEnvError('SERVICE_NAME')
      );
    });

    it('fails to create an instance of metrics when METRICS_NAMESPACE is not defined', () => {
      vi.stubEnv('SERVICE_NAME', 'MetricsTest');

      expect(() => container.get(MetricsModule)).toThrowError(
        new MissingRequiredEnvError('METRICS_NAMESPACE')
      );
    });
  });
});
