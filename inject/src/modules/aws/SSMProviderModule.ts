import {SSMProvider} from '@aws-lambda-powertools/parameters/ssm';
import type {SSMClientConfig} from '@aws-sdk/client-ssm';
import {Container} from 'inversify';
import {inject, injectable} from '../../annotation/InjectorAnnotations';
import {env} from '../../annotation/LambdaAnnotations';
import {Module} from '../Module';

@injectable()
export class SSMProviderModule extends Module {
  constructor(
    @inject(Container) protected readonly container: Container,
    @env('AWS_REGION') protected readonly region: string
  ) {
    super(container);
  }

  configure(): void {
    const clientConfig: SSMClientConfig = {region: this.region};
    const ssmProvider = new SSMProvider({
      clientConfig,
    });

    this.container.bind<SSMProvider>(SSMProvider).toConstantValue(ssmProvider);
  }
}
