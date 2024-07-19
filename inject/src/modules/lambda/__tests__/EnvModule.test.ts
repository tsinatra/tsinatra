import {Container} from 'inversify';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  MissingEnvNameError,
  MissingRequiredEnvError,
} from '../../../../../errors';
import {
  inject,
  injectable,
  named,
  optional,
} from '../../../annotation/InjectorAnnotations';
import {env} from '../../../annotation/LambdaAnnotations';
import {LambdaBinding} from '../../../bindings/LambdaBinding';
import {EnvModule} from '../EnvModule';

@injectable()
class TestClass {
  constructor(
    @inject(LambdaBinding.Env)
    @named('API_KEY')
    public readonly apiKey: string,

    @inject(LambdaBinding.Env)
    @named('INFURA_KEY')
    @optional()
    public readonly infuraApiKey?: string,

    @env('SECRET_KEY')
    @optional()
    public readonly secretKey?: string
  ) {}
}

@injectable()
class MissingNameTestClass {
  constructor(
    @inject(LambdaBinding.Env)
    public readonly apiKey: string
  ) {}
}

describe('EnvModule', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    const envModule = container.get(EnvModule);
    envModule.configure();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('correctly binds the env using the correct name', () => {
    vi.stubEnv('API_KEY', '123456');
    vi.stubEnv('INFURA_KEY', '987654');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.infuraApiKey).toEqual('987654');
    expect(testClass.secretKey).toBeUndefined();
  });

  it('Throws an error when a required env is missing', () => {
    vi.stubEnv('INFURA_KEY', '987654');

    try {
      container.get(TestClass);
    } catch (e) {
      expect(e).toBeInstanceOf(MissingRequiredEnvError);
      expect((e as Error).message).toEqual(
        'Missing required environment variable: API_KEY'
      );
    }
  });

  it('Does not throw an error when an optional env is missing', () => {
    vi.stubEnv('API_KEY', '123456');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.infuraApiKey).toBeUndefined();
    expect(testClass.secretKey).toBeUndefined();
  });

  it('Throws an error when the `@named` annotation is missing', () => {
    vi.stubEnv('API_KEY', '123456');

    try {
      container.get(MissingNameTestClass);
    } catch (e) {
      expect(e).toBeInstanceOf(MissingEnvNameError);
      expect((e as Error).message).toEqual(
        "`LambdaBinding.Env` is trying to inject an Env variable without specifying its name using the `@named('envName')` annotation."
      );
    }
  });

  it('works with `@env` annotation', () => {
    vi.stubEnv('API_KEY', '123456');
    vi.stubEnv('SECRET_KEY', '1.420.69');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.infuraApiKey).toBeUndefined();
    expect(testClass.secretKey).toBe('1.420.69');
  });

  it('works with envOverrides', () => {
    vi.stubEnv('API_KEY', '123456');
    vi.stubEnv('SECRET_KEY', '1.420.69');

    container
      .bind(LambdaBinding.EnvOverrides)
      .toConstantValue({API_KEY: '420'});

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('420');
    expect(testClass.infuraApiKey).toBeUndefined();
    expect(testClass.secretKey).toBe('1.420.69');
  });
});
