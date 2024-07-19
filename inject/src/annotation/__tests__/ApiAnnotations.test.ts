import {Container} from 'inversify';
import {beforeEach, describe, expect, it} from 'vitest';
import {ApiBinding} from '../../bindings/ApiBinding';
import {param} from '../ApiAnnotations';
import {singleton} from '../Singleton';

enum TradeType {
  ExactIn = 'ExactIn',
  ExactOut = 'ExactOut',
}

enum ChainId {
  Mainnet = 1,
  Polygon = 137,
  MadeUp = 420,
}
@singleton(TestApiParamAnnotations)
class TestApiParamAnnotations {
  constructor(
    @param() public name: string,
    @param() public lastName: string,
    @param(Number) public age: number,
    @param(Number) public height: number,
    @param(Boolean) public isAwesome: boolean,
    @param(Boolean) public isNotAwesome: boolean,
    @param(TradeType) public tradeType: TradeType,
    @param(ChainId) public chainId: ChainId,
    @param(BigInt) public amount: bigint
  ) {}
}

describe('ApiAnnotations', () => {
  let container: Container;
  const name = 'Tsiny';
  const lastName = 'Natra';
  const age = 30;
  const height = 170;
  const isAwesome = true;
  const isNotAwesome = false;
  const tradeType = TradeType.ExactOut;
  const chainId = ChainId.MadeUp;
  const amount = BigInt(100000000);

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container
      .bind<string>(ApiBinding.Param)
      .toConstantValue(name)
      .whenTargetNamed('name');
    container
      .bind<string>(ApiBinding.Param)
      .toConstantValue(lastName)
      .whenTargetNamed('lastName');

    container
      .bind<number>(ApiBinding.Param)
      .toConstantValue(age)
      .whenTargetNamed('age');
    container
      .bind<number>(ApiBinding.Param)
      .toConstantValue(height)
      .whenTargetNamed('height');

    container
      .bind<boolean>(ApiBinding.Param)
      .toConstantValue(isAwesome)
      .whenTargetNamed('isAwesome');
    container
      .bind<boolean>(ApiBinding.Param)
      .toConstantValue(isNotAwesome)
      .whenTargetNamed('isNotAwesome');

    container
      .bind<unknown>(ApiBinding.Param)
      .toConstantValue(tradeType)
      .whenTargetNamed('tradeType');
    container
      .bind<unknown>(ApiBinding.Param)
      .toConstantValue(chainId)
      .whenTargetNamed('chainId');

    container
      .bind<bigint>(ApiBinding.Param)
      .toConstantValue(amount)
      .whenTargetNamed('amount');
  });

  it('correctly injects the named annotations', () => {
    const instance = container.get(TestApiParamAnnotations);
    expect(instance).toBeDefined();
    expect(instance.name).toBe(name);
    expect(instance.lastName).toBe(lastName);
    expect(instance.age).toBe(age);
    expect(instance.height).toBe(height);
    expect(instance.isAwesome).toBe(isAwesome);
    expect(instance.isNotAwesome).toBe(isNotAwesome);
    expect(instance.tradeType).toBe(tradeType);
    expect(instance.chainId).toBe(chainId);
    expect(instance.amount).toBe(amount);
  });
});
