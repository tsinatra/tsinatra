import {SecretsProvider} from '@aws-lambda-powertools/parameters/secrets';
import {Container} from 'inversify';
import {inject, injectable} from '../../annotation/InjectorAnnotations';
import {env} from '../../annotation/LambdaAnnotations';
import {Module} from '../Module';

@injectable()
export class SecretsProviderModule extends Module {
  constructor(
    @inject(Container) protected readonly container: Container,
    @env('AWS_REGION') protected readonly region: string
  ) {
    super(container);
  }

  configure(): void {
    this.container
      .bind<SecretsProvider>(SecretsProvider)
      .toConstantValue(
        new SecretsProvider({clientConfig: {region: this.region}})
      );
  }
}
