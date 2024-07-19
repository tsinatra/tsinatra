import {Logger} from '@aws-lambda-powertools/logger';
import {Metrics} from '@aws-lambda-powertools/metrics';
import {SSMProvider} from '@aws-lambda-powertools/parameters/ssm';
import {ParameterStore} from '../src/ParameterStore';
import {beforeEach, describe, expect, it, Mock, vi} from 'vitest';
import {NumberParamIsNaNError} from '../../errors/src/validation/NumberParamIsNaNError';

describe('ParameterStore', () => {
  let parameterStore: ParameterStore;
  let ssmProviderGet: Mock;

  beforeEach(() => {
    ssmProviderGet = vi.fn();

    const ssmProvider = {
      get: ssmProviderGet,
    } as unknown as SSMProvider;

    const metrics = {
      addMetric: vi.fn(),
    } as unknown as Metrics;

    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    parameterStore = new ParameterStore(
      ssmProvider,
      'TestService',
      'testStage',
      metrics,
      logger
    );
  });

  describe('#get', () => {
    beforeEach(() => {
      ssmProviderGet.mockReturnValue('true');
    });

    it('returns a string', async () => {
      const param = await parameterStore.get('parameter-name');
      expect(param).toEqual('true');
      expect(typeof param).toEqual('string');
    });

    it('uses kebabCase for the service and stage', async () => {
      await parameterStore.get('parameter-name');

      expect(ssmProviderGet).toHaveBeenCalledWith(
        '/test-service/test-stage/parameter-name',
        {maxAge: 300}
      );
    });

    it('forwards the ttl option', async () => {
      await parameterStore.get('parameter-name', {ttl: 150});

      expect(ssmProviderGet).toHaveBeenCalledWith(
        '/test-service/test-stage/parameter-name',
        {maxAge: 150}
      );
    });

    describe('defaultValue', () => {
      it('ignores the default value when ssmProvider returns a value', async () => {
        const param = await parameterStore.get('parameter-name', {
          defaultValue: 'false',
        });
        expect(param).toEqual('true');
      });

      it('uses the default value when ssmProvider returns undefined', async () => {
        ssmProviderGet.mockReturnValue(undefined);
        const param = await parameterStore.get('parameter-name', {
          defaultValue: 'false',
        });
        expect(param).toEqual('false');
      });

      it('uses the default value when ssmProvider throws an error', async () => {
        ssmProviderGet.mockRejectedValue(new Error('error'));
        const param = await parameterStore.get('parameter-name', {
          defaultValue: 'error',
        });
        expect(param).toEqual('error');
      });
    });
  });

  describe('#getBoolean', () => {
    beforeEach(() => {
      ssmProviderGet.mockReturnValue('true');
    });

    it('returns a boolean', async () => {
      const param = await parameterStore.getBoolean('parameter-name');
      expect(param).toEqual(true);
      expect(typeof param).toEqual('boolean');
    });

    it('forwards the ttl option', async () => {
      await parameterStore.getBoolean('parameter-name', {ttl: 150});

      expect(ssmProviderGet).toHaveBeenCalledWith(
        '/test-service/test-stage/parameter-name',
        {maxAge: 150}
      );
    });

    it('defaults to false when the parameter from ssm is not truthy', async () => {
      ssmProviderGet.mockReturnValue('yolo');
      const param = await parameterStore.getBoolean('parameter-name');
      expect(param).toEqual(false);
      expect(typeof param).toEqual('boolean');
    });

    it('returns true when the parameter from ssm is 1', async () => {
      ssmProviderGet.mockReturnValue('1');
      const param = await parameterStore.getBoolean('parameter-name');
      expect(param).toEqual(true);
      expect(typeof param).toEqual('boolean');
    });

    it('returns true when the parameter from ssm is t', async () => {
      ssmProviderGet.mockReturnValue('t');
      const param = await parameterStore.getBoolean('parameter-name');
      expect(param).toEqual(true);
      expect(typeof param).toEqual('boolean');
    });

    it('returns true when the parameter from ssm is capitalized', async () => {
      ssmProviderGet.mockReturnValue('True');
      const param = await parameterStore.getBoolean('parameter-name');
      expect(param).toEqual(true);
      expect(typeof param).toEqual('boolean');
    });

    describe('defaultValue', () => {
      it('ignores the default value when ssmProvider returns a value', async () => {
        const param = await parameterStore.getBoolean('parameter-name', {
          defaultValue: false,
        });
        expect(param).toEqual(true);
      });

      it('uses the default value when ssmProvider returns undefined', async () => {
        ssmProviderGet.mockReturnValue(undefined);
        const param = await parameterStore.getBoolean('parameter-name', {
          defaultValue: false,
        });
        expect(param).toEqual(false);
      });

      it('uses the default value when ssmProvider throws an error', async () => {
        ssmProviderGet.mockRejectedValue(new Error('error'));
        const param = await parameterStore.getBoolean('parameter-name', {
          defaultValue: true,
        });
        expect(param).toEqual(true);
      });
    });
  });

  describe('#getNumber', () => {
    beforeEach(() => {
      ssmProviderGet.mockReturnValue('10');
    });

    it('returns a number', async () => {
      const param = await parameterStore.getNumber('parameter-name');
      expect(param).toEqual(10);
      expect(typeof param).toEqual('number');
    });

    it('forwards the ttl option', async () => {
      await parameterStore.getNumber('parameter-name', {ttl: 150});

      expect(ssmProviderGet).toHaveBeenCalledWith(
        '/test-service/test-stage/parameter-name',
        {maxAge: 150}
      );
    });

    it('throws a NaN error when the parameter from ssm is not a number', async () => {
      ssmProviderGet.mockReturnValue('yolo');
      try {
        await parameterStore.getNumber('parameter-name');
        expect.unreachable('Expected an error');
      } catch (error) {
        expect(error).toEqual(
          new NumberParamIsNaNError('/test-service/test-stage/parameter-name')
        );
      }
    });

    it('works with decimals', async () => {
      ssmProviderGet.mockReturnValue('1.2345');
      const param = await parameterStore.getNumber('parameter-name');
      expect(param).toEqual(1.2345);
      expect(typeof param).toEqual('number');
    });

    describe('defaultValue', () => {
      it('ignores the default value when ssmProvider returns a value', async () => {
        const param = await parameterStore.getNumber('parameter-name', {
          defaultValue: 100,
        });
        expect(param).toEqual(10);
      });

      it('uses the default value when ssmProvider returns undefined', async () => {
        ssmProviderGet.mockReturnValue(undefined);
        const param = await parameterStore.getNumber('parameter-name', {
          defaultValue: 69,
        });
        expect(param).toEqual(69);
      });

      it('uses the default value when ssmProvider throws an error', async () => {
        ssmProviderGet.mockRejectedValue(new Error('error'));
        const param = await parameterStore.getNumber('parameter-name', {
          defaultValue: 420,
        });
        expect(param).toEqual(420);
      });
    });
  });
});
