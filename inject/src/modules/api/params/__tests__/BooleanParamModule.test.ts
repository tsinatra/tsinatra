import {ParamsModule} from 'inject/src/modules/api/params/ParamsModule';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingRequiredParamError} from '../../../../../../errors/src/validation/MissingRequiredParamError';
import {pathParam} from '../../../../annotation/ApiAnnotations';
import {injectable, optional} from '../../../../annotation/InjectorAnnotations';

@injectable()
class TestClass {
  constructor(
    @pathParam(Boolean)
    public readonly isToken: boolean,

    @pathParam(Boolean)
    @optional()
    public readonly isMainnet?: boolean,

    @pathParam(Boolean)
    @optional()
    public readonly isFoT?: boolean
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

describe('BooleanParamModule', () => {
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
    params.set('isToken', 'true');
    params.set('isMainnet', 'false');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.isToken).toBe(true);
    expect(testClass.isMainnet).toBe(false);
    expect(testClass.isFoT).toBeUndefined();
  });

  it('works when values are 1 and 0', () => {
    params.set('isToken', '1');
    params.set('isMainnet', '0');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.isToken).toBe(true);
    expect(testClass.isMainnet).toBe(false);
    expect(testClass.isFoT).toBeUndefined();
  });

  it('works when values are t and f', () => {
    params.set('isToken', 'f');
    params.set('isMainnet', 't');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.isToken).toBe(false);
    expect(testClass.isMainnet).toBe(true);
    expect(testClass.isFoT).toBeUndefined();
  });

  it('Throws an error when a required param is missing', () => {
    params.set('isMainnet', 't');

    try {
      container.get(TestClass);
    } catch (e) {
      expect((e as Error).message).toEqual(
        'Missing required path parameter: isToken'
      );
    }
  });

  it('Does not throw an error when an optional param is missing', () => {
    params.set('isToken', 't');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.isToken).toBe(true);
    expect(testClass.isMainnet).toBeUndefined();
    expect(testClass.isFoT).toBeUndefined();
  });

  it('works with `@booleanParam` annotation', () => {
    params.set('isToken', 't');
    params.set('isFoT', 'f');

    const testClass = container.get(TestClass);

    expect(testClass).toBeDefined();
    expect(testClass.isToken).toBe(true);
    expect(testClass.isMainnet).toBeUndefined();
    expect(testClass.isFoT).toBe(false);
  });
});
