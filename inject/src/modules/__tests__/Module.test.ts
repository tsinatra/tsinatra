import {Container} from 'inversify';
import {beforeEach, describe, expect, it, SpyInstance, vi} from 'vitest';
import {injectable} from '../../annotation/InjectorAnnotations';
import {Module} from '../Module';

@injectable()
class TestModule extends Module {
  configure(): void {
    this.container.bind('Test').toConstantValue('Test');
  }
}

describe('Module', () => {
  let container: Container;
  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind<Container>(Container).toConstantValue(container);
  });

  describe('#configure', () => {
    describe('with spied container', () => {
      let containerSpy: SpyInstance;

      beforeEach(() => {
        containerSpy = vi.spyOn(container, 'bind');
      });

      it('calls the container of an Module with no dependencies', () => {
        const module = container.get(TestModule);

        // We are testing indirectly by looking at the underlying calls on the container.
        expect(containerSpy).not.toHaveBeenCalledWith('Test');
        module.configure();
        expect(containerSpy).toHaveBeenCalledWith('Test');
      });
    });
  });
});
