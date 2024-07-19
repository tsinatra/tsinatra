import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingRequiredParamError} from '../../../../../../errors/src/validation/MissingRequiredParamError';
import {pathParam} from '../../../../annotation/ApiAnnotations';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

@injectable()
class TestClass {
  constructor(
    @pathParam(String, {name: 'nameParam'})
    public readonly name: string,

    @pathParam()
    @optional()
    public readonly network?: string,

    @pathParam(String, {name: 'tokenInAddress'})
    @optional()
    public readonly tokenIn?: string
  ) {}
}

const {mockedUsePathParams} = vi.hoisted(() => {
  return {
    mockedUsePathParams: vi.fn(),
  };
});

vi.mock('sst/node/api', () => {
  return {
    usePathParams: mockedUsePathParams,
  };
});

describe('StringParamModule', () => {
  let container: Container;
  let params: Map<string, string>;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    params = new Map();
    mockedUsePathParams.mockImplementation(() => Object.fromEntries(params));
    const paramsModule = container.get(ParamsModule);
    paramsModule.configure();
  });

  it('correctly binds the params using the correct name', () => {
    params.set('nameParam', 'Tsiny Natra');
    params.set('network', 'Ethereum');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.name).toEqual('Tsiny Natra');
    expect(testClass.network).toEqual('Ethereum');
    expect(testClass.tokenIn).toBeUndefined();
  });

  it('Throws an error when a required param is missing', () => {
    params.set('network', 'Ethereum');

    try {
      container.get(TestClass);
    } catch (e) {
      expect(e).toBeInstanceOf(MissingRequiredParamError);
      expect((e as Error).message).toEqual(
        'Missing required path parameter: nameParam'
      );
    }
  });

  it('Does not throw an error when an optional param is missing', () => {
    params.set('nameParam', 'Tsiny Natra');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.name).toEqual('Tsiny Natra');
    expect(testClass.network).toBeUndefined();
    expect(testClass.tokenIn).toBeUndefined();
  });

  it('works with `@stringParam` annotation', () => {
    params.set('nameParam', 'Tsiny Natra');
    params.set('tokenInAddress', '0x1234567890abcdef1234567890abcdef12345678');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.name).toEqual('Tsiny Natra');
    expect(testClass.network).toBeUndefined();
    expect(testClass.tokenIn).toBe(
      '0x1234567890abcdef1234567890abcdef12345678'
    );
  });
});
