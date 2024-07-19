import {ValidationError} from './ValidationError';

export class MissingParamNameError extends ValidationError {
  constructor() {
    super(
      "`ApiBinding.Param` is trying to inject a Param without specifying its name using the `@named('paramName')` annotation."
    );
  }
}
