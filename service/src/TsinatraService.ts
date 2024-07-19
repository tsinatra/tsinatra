import {getClassNameOf} from '../../utils';
import {ClientSideError} from '../../errors/src/http/ClientSideError';
import {ServerSideError} from '../../errors/src/http/ServerSideError';
import {BaseHandler} from '../../handler/src/BaseHandler';
import {
  Container,
  inject,
  injectable,
} from '../../inject/src/annotation/InjectorAnnotations';
import {LambdaBinding} from '../../inject/src/bindings/LambdaBinding';
import {Module} from '../../inject/src/modules/Module';
import {ScopedMetrics} from '../../metrics/src/ScopedMetrics';
import {Constructor} from '../../models/src/Constructor';

@injectable()
export abstract class TsinatraService {
  private readonly container: Container;
  private readonly envOverrides: Record<string, string>;
  private initialized: boolean;

  constructor(
    @inject(Container)
    container: Container,
    @inject(ScopedMetrics)
    protected readonly metrics: ScopedMetrics
  ) {
    // Container used for this client, we will install the required modules in this container.
    this.container = container.createChild();

    // Bind the container onto itself.
    this.container.bind(Container).toConstantValue(this.container);

    // Load the current envOverrides
    try {
      this.envOverrides = container.get(LambdaBinding.EnvOverrides) as Record<
        string,
        string
      >;
    } catch (e) {
      this.envOverrides = {};
    }

    // This client has to initialize on first call.
    this.initialized = false;
  }

  protected abstract modules: Constructor<Module>[];
  protected serviceName: string | undefined = undefined;

  protected async send<Req, Res>(
    handlerClass: Constructor<BaseHandler<Req, Res>>,
    request: Req
  ): Promise<Res> {
    this.initializeClient();

    let response: Res;
    const handler = this.container.get<BaseHandler<Req, Res>>(handlerClass);
    const handlerScope = this.metrics.scope(getClassNameOf(handler));
    const handlerLatencyStopwatch = handlerScope.stopwatch('Latency');

    try {
      // Invoke the handler
      response = await handler.handle(request);

      handlerScope.counter('Success').increment(1);
    } catch (error) {
      if (error instanceof ClientSideError) {
        handlerScope.counter('ClientSideError').increment(1);
      } else if (error instanceof ServerSideError) {
        handlerScope.counter('ServerSideError').increment(1);
      }

      handlerScope.scope('Error').counter(getClassNameOf(error)).increment(1);

      throw error;
    } finally {
      handlerLatencyStopwatch.stop();

      handlerScope.counter('Request').increment(1);
    }

    return response;
  }

  private initializeClient(): void {
    if (!this.initialized) {
      const initializeScope = this.metrics.scope('Initialize');
      try {
        // Set EnvOverrides
        this.container.bind(LambdaBinding.EnvOverrides).toConstantValue({
          ...this.envOverrides,
          SERVICE_NAME: this.serviceName ?? getClassNameOf(this),
        });

        // Install the required modules if the client hasn't been initialized yet.
        for (const moduleClass of this.modules) {
          const module = this.container.get(moduleClass);
          module.configure();
        }
      } catch (error) {
        initializeScope.counter('Error').increment();
        throw error;
      }

      this.initialized = true;
      initializeScope.counter('Success').increment();
    }
  }
}
