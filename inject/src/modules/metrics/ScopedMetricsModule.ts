import {Metrics} from '@aws-lambda-powertools/metrics';
import {Container, injectable, interfaces} from 'inversify';
import {inject} from '../../../../inject/src/annotation/InjectorAnnotations';
import {LambdaBinding} from '../../../../inject/src/bindings/LambdaBinding';
import {ScopedMetrics} from '../../../../metrics/src/ScopedMetrics';
import {Module} from '../Module';

@injectable()
export class ScopedMetricsModule extends Module {
  constructor(
    @inject(Container) protected readonly container: Container,
    @inject(LambdaBinding.Name) protected readonly lambdaName: string,
    @inject(Metrics) protected readonly metrics: Metrics
  ) {
    super(container);
  }

  configure(): void {
    this.container
      .bind<ScopedMetrics>(ScopedMetrics)
      .toDynamicValue((context: interfaces.Context) => {
        const metricsScope = this.getMetricsScope(context);

        return new ScopedMetrics(metricsScope, this.metrics);
      })
      .inTransientScope();
  }

  private getMetricsScope(context: interfaces.Context) {
    if (context.currentRequest.target.getNamedTag()) {
      // first we try with the named tag.
      return context.currentRequest.target.getNamedTag()!.value;
    } else if (
      typeof context.currentRequest.parentRequest?.serviceIdentifier ===
      'function'
    ) {
      // then we try with the parentRequest serviceIdentifier
      // it should be the serviceIdentifier for the class in which we want to inject this ScopedMetric to
      return context.currentRequest.parentRequest.serviceIdentifier.name;
    } else {
      // If serviceIdentifier is not a constructor, or there's no parent request, then we the lambda name.
      return this.lambdaName;
    }
  }
}
