import {UnexpectedTypeError} from 'errors';
import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingRequiredParamError} from '../../../../../../errors/src/validation/MissingRequiredParamError';
import {queryParam} from '../../../../annotation/ApiAnnotations';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

enum TradeType {
  ExactIn = 'ExactIn',
  ExactOut = 'ExactOut',
}

enum ChainId {
  Mainnet = 1,
  Polygon = 137,
  MadeUp = 420,
}

@injectable()
class TestClass {
  constructor(
    @queryParam(TradeType)
    public readonly tradeType: TradeType,

    @queryParam(ChainId)
    @optional()
    public readonly chainId?: ChainId
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

describe('EnumParamModule', () => {
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
    params.set('tradeType', 'ExactIn');
    params.set('chainId', '1');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.tradeType).toEqual(TradeType.ExactIn);
    expect(testClass.chainId).toBe(ChainId.Mainnet);
  });

  it('Throws an error when a required param is missing', () => {
    params.set('chainId', '420');

    expect(() => container.get(TestClass)).toThrowError(
      new MissingRequiredParamError('tradeType', 'query parameter')
    );
  });

  it('Does not throw an error when an optional param is missing', () => {
    params.set('tradeType', 'ExactOut');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.tradeType).toEqual(TradeType.ExactOut);
    expect(testClass.chainId).toBeUndefined();
  });

  it('Throws an error when the param is not part of the enum', () => {
    params.set('tradeType', 'ExactMixed');

    expect(() => container.get(TestClass)).toThrowError(
      new UnexpectedTypeError(TradeType, 'ExactMixed')
    );
  });

  it('Throws an error when optional param is not part of the enum', () => {
    params.set('tradeType', 'ExactIn');
    params.set('chainId', '69');

    expect(() => container.get(TestClass)).toThrowError(
      new UnexpectedTypeError(ChainId, '69')
    );
  });
});
