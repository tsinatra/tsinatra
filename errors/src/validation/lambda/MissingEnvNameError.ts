import {ValidationError} from '../ValidationError';

export class MissingEnvNameError extends ValidationError {
  constructor() {
    super(
      "`LambdaBinding.Env` is trying to inject an Env variable without specifying its name using the `@named('envName')` annotation."
    );
  }
}
