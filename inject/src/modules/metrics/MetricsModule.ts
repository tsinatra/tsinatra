import {Metrics} from '@aws-lambda-powertools/metrics';
import {Container} from 'inversify';
import {inject, injectable} from '../../annotation/InjectorAnnotations';
import {env} from '../../annotation/LambdaAnnotations';
import {LambdaBinding} from '../../bindings/LambdaBinding';
import {Module} from '../Module';

/**
 * Injects a Metrics instance.
 * Instance is a Singleton in the scope of a Lambda.
 * Required Environment Variables:
 * 1. `SERVICE_NAME` ->
 *        Sets the `service` dimension in the metrics.
 * 2. `METRICS_NAMESPACE` ->
 *        Sets the `namespace` of the metrics (This is a logical grouping of services, it could be your organization name)
 */
@injectable()
export class MetricsModule extends Module {
  constructor(
    @inject(Container) protected readonly container: Container,
    @inject(LambdaBinding.Name) protected readonly lambdaName: string,
    @env('SERVICE_NAME') protected readonly serviceName: string,
    @env('METRICS_NAMESPACE') protected readonly namespace: string
  ) {
    super(container);
  }

  configure(): void {
    // Bind metrics to DI Container.
    this.container.bind<Metrics>(Metrics).toConstantValue(
      new Metrics({
        serviceName: this.serviceName,
        namespace: this.namespace,
        defaultDimensions: {
          lambda: this.lambdaName,
        },
      })
    );
  }
}
