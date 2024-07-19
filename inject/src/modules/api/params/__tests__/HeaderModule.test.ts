import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {header} from '../../../../annotation/ApiAnnotations';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

@injectable()
class TestClass {
  constructor(
    @header('apiKey')
    public readonly apiKey: string,

    @header('deviceId')
    @optional()
    public readonly deviceId?: string,

    @header('appVersion')
    @optional()
    public readonly appVersion?: string
  ) {}
}

const {mockedUseHeaders} = vi.hoisted(() => {
  return {mockedUseHeaders: vi.fn()};
});

vi.mock('sst/node/api', () => {
  return {useHeaders: mockedUseHeaders};
});

describe('HeaderModule', () => {
  let container: Container;
  let headers: Map<string, string>;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    headers = new Map();
    mockedUseHeaders.mockImplementation(() => Object.fromEntries(headers));
    const paramsModule = container.get(ParamsModule);
    paramsModule.configure();
  });

  it('correctly binds the headers using the correct name', () => {
    headers.set('apiKey', '123456');
    headers.set('deviceId', '987654');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.deviceId).toEqual('987654');
    expect(testClass.appVersion).toBeUndefined();
  });

  it('Throws an error when a required header is missing', () => {
    headers.set('deviceId', '987654');

    try {
      container.get(TestClass);
    } catch (e) {
      expect((e as Error).message).toEqual('Missing required header: apiKey');
    }
  });

  it('Does not throw an error when an optional header is missing', () => {
    headers.set('apiKey', '123456');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.deviceId).toBeUndefined();
    expect(testClass.appVersion).toBeUndefined();
  });

  it('works with `@header` annotation', () => {
    headers.set('apiKey', '123456');
    headers.set('appVersion', '1.420.69');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.apiKey).toEqual('123456');
    expect(testClass.deviceId).toBeUndefined();
    expect(testClass.appVersion).toBe('1.420.69');
  });
});
