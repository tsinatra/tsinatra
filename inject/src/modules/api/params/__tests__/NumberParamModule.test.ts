import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingParamNameError} from '../../../../../../errors/src/validation/MissingParamNameError';
import {MissingRequiredParamError} from '../../../../../../errors/src/validation/MissingRequiredParamError';
import {queryParam} from '../../../../annotation/ApiAnnotations';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

@injectable()
class TestClass {
  constructor(
    @queryParam(Number)
    public readonly amount: number,

    @queryParam(Number)
    @optional()
    public readonly chainId?: number,

    @queryParam(Number)
    @optional()
    public readonly blockNumber?: number
  ) {}
}

const {mockedUseQueryParams} = vi.hoisted(() => {
  return {
    mockedUseQueryParams: vi.fn(),
  };
});

vi.mock('sst/node/api', () => {
  return {
    useQueryParams: mockedUseQueryParams,
  };
});

describe('NumberParamModule', () => {
  let container: Container;
  let params: Map<string, string>;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    params = new Map();
    mockedUseQueryParams.mockImplementation(() => Object.fromEntries(params));
    const paramsModule = container.get(ParamsModule);
    paramsModule.configure();
  });

  it('correctly binds the params using the correct name', () => {
    params.set('amount', '1.42');
    params.set('chainId', '1');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.amount).toEqual(1.42);
    expect(testClass.chainId).toEqual(1);
    expect(testClass.blockNumber).toBeUndefined();
  });

  it('Throws an error when a required param is missing', () => {
    params.set('chainId', '1');

    try {
      container.get(TestClass);
    } catch (e) {
      expect(e).toBeInstanceOf(MissingRequiredParamError);
      expect((e as Error).message).toEqual(
        'Missing required query parameter: amount'
      );
    }
  });

  it('Does not throw an error when an optional param is missing', () => {
    params.set('amount', '420.69');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.amount).toEqual(420.69);
    expect(testClass.chainId).toBeUndefined();
    expect(testClass.blockNumber).toBeUndefined();
  });

  it('works with `@numberParam` annotation', () => {
    params.set('amount', '420.69');
    params.set('blockNumber', '123456');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.amount).toEqual(420.69);
    expect(testClass.chainId).toBeUndefined();
    expect(testClass.blockNumber).toBe(123456);
  });
});
