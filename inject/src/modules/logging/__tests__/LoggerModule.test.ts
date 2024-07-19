import {Logger} from '@aws-lambda-powertools/logger';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {LambdaBinding} from '../../../bindings/LambdaBinding';
import {EnvModule} from '../../lambda/EnvModule';
import {LoggerModule} from '../LoggerModule';

describe('LoggerModule', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    container.bind(LambdaBinding.Name).toConstantValue('LambdaName');

    vi.stubEnv('SERVICE_NAME', 'LoggerTest');

    const envModule = container.get(EnvModule);
    envModule.configure();

    const loggerModule = container.get(LoggerModule);
    loggerModule.configure();
  });

  it('correctly binds the Root Logger instance', () => {
    const logger = container.get(Logger);

    expect(logger).toBeDefined();
    expect(logger.getPersistentLogAttributes()['loggerName']).toEqual(
      'LambdaName'
    );
  });

  it('correctly binds a named Logger instance', () => {
    const logger = container.getNamed(Logger, 'NamedLogger');

    expect(logger).toBeDefined();
    expect(logger.getPersistentLogAttributes()['loggerName']).toEqual(
      'NamedLogger'
    );
  });

  it('caches the named loggers', () => {
    const logger = container.getNamed(Logger, 'NamedLogger');
    const otherLogger = container.getNamed(Logger, 'OtherNamedLogger');
    const loggerAgain = container.getNamed(Logger, 'NamedLogger');

    expect(logger).toBeDefined();
    expect(otherLogger).toBeDefined();
    expect(loggerAgain).toBeDefined();

    expect(logger).not.toBe(otherLogger);
    expect(loggerAgain).not.toBe(otherLogger);
    expect(logger).toBe(loggerAgain);
  });
});
