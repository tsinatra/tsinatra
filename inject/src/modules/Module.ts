import {Container} from 'inversify';
import {inject, injectable} from '../annotation/InjectorAnnotations';

/**
 * Base class to create Modules.
 * A Module is used to define how a dependency will be injected in our lambda.
 *
 * Module receives an injected instance of `Container` which is what gets used to bind classes to.
 *
 * The required method to be implemented by a subclass of `Module` is `configure()`.
 *
 * e.g.
 * ```
 *   class AxiosModule extends Module {
 *     configure(): void {
 *       this.container.bind<Axios>(Axios).toDynamicValue(axios.create());
 *     }
 *   }
 * ```
 */
@injectable()
export abstract class Module {
  /**
   * Base constructor for the `Module` receives an injected `Container` used for our bindings.
   * @param container
   */
  constructor(@inject(Container) protected readonly container: Container) {}

  /**
   * Method used to configure our injected dependency, it receives the container that will bind our injection
   *
   * @public
   * @abstract
   */
  public abstract configure(): void;
}
