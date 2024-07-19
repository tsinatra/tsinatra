import {Container} from 'inversify';
import {buildProviderModule} from 'inversify-binding-decorators';
import {beforeEach, describe, expect, it} from 'vitest';
import {inject, injectable} from '../InjectorAnnotations';
import {singleton} from '../Singleton';

@singleton(TestSingleton)
class TestSingleton {
  constructor(@inject('name') public name: string) {}
}

@injectable()
class TestRegular {
  constructor(@inject('name') public name: string) {}
}
describe('Singleton annotation', () => {
  let container: Container;
  let name: string;
  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    name = '';
    container.bind<string>('name').toDynamicValue(() => {
      name = `${name}test`;
      return name;
    });
    container.load(buildProviderModule());
  });

  describe('when the annotation is used on a class', () => {
    it('should create a singleton', () => {
      const instance = container.get(TestSingleton);
      expect(instance).toBeDefined();
    });

    it('should create a singleton with the same instance', () => {
      const instance1 = container.get(TestSingleton);
      const instance2 = container.get(TestSingleton);
      expect(instance1).toBe(instance2);
    });
  });

  describe('when the annotation is NOT used on a class', () => {
    it('should create a regular instance', () => {
      const instance = container.get(TestRegular);
      expect(instance).toBeDefined();
    });

    it('should create a regular instance with a different instance', () => {
      const instance1 = container.get(TestRegular);
      const instance2 = container.get(TestRegular);
      expect(instance1).not.toBe(instance2);
    });
  });
});
