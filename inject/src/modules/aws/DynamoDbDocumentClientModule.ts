import {DynamoDB} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {Container} from 'inversify';
import {injectable, inject} from '../../annotation/InjectorAnnotations';
import {env} from '../../annotation/LambdaAnnotations';
import {Module} from '../Module';

@injectable()
export class DynamoDbDocumentClientModule extends Module {
  constructor(
    @inject(Container)
    protected readonly container: Container,
    @env('SST_STAGE')
    protected readonly stage: string
  ) {
    super(container);
  }

  configure() {
    this.container
      .bind(DynamoDBDocumentClient)
      .toDynamicValue(() => {
        const endpoint =
          this.stage === 'test' ? 'http://localhost:8000' : undefined;
        const ddbClient = new DynamoDB({endpoint});

        return DynamoDBDocumentClient.from(ddbClient);
      })
      .inSingletonScope();
  }
}
