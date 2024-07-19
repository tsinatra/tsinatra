import {UnexpectedTypeError} from 'errors';
import {queryParam} from 'inject/src/annotation/ApiAnnotations';
import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingRequiredParamError} from '../../../../../../errors/src/validation/MissingRequiredParamError';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

@injectable()
class TestClass {
  constructor(
    @queryParam(BigInt)
    public readonly amount: bigint,

    @queryParam(BigInt)
    @optional()
    public readonly fee?: bigint
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

describe('BigIntParamModule', () => {
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
    params.set('amount', '1000000000000000000000000000');
    params.set('fee', '420');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.amount).toEqual(BigInt('1000000000000000000000000000'));
    expect(testClass.fee).toEqual(BigInt(420));
  });

  it('Throws an error when a required param is missing', () => {
    params.set('fee', '420');

    expect(() => container.get(TestClass)).toThrowError(
      new MissingRequiredParamError('amount', 'query parameter')
    );
  });

  it('Does not throw an error when an optional param is missing', () => {
    params.set('amount', '1000000000000000000000000000');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.amount).toEqual(BigInt('1000000000000000000000000000'));
    expect(testClass.fee).toBeUndefined();
  });

  it('Throws an error when attempting to parse a decimal number', () => {
    params.set('amount', '1.45');
    params.set('fee', '420');

    expect(() => container.get(TestClass)).toThrowError(
      new UnexpectedTypeError(BigInt, '1.45')
    );
  });

  it('Throws an error when attempting to parse a string', () => {
    params.set('amount', '420');
    params.set('fee', 'fees');

    expect(() => container.get(TestClass)).toThrowError(
      new UnexpectedTypeError(BigInt, 'fees')
    );
  });
});
