import DynamoDB from 'aws-sdk/clients/dynamodb';
import {injectable} from '../../annotation/InjectorAnnotations';
import {AwsBinding} from '../../bindings/AwsBinding';
import {Module} from '../Module';

@injectable()
export class DeprecatedDocumentClientModule extends Module {
  configure() {
    this.container
      .bind(AwsBinding.DocumentClient)
      .toConstantValue(new DynamoDB.DocumentClient());
  }
}
