import {ValidationError} from '../validation/ValidationError';

export class MissingJsonPropertyNameError extends ValidationError {
  constructor() {
    super(
      "`ApiBinding.JsonProperty` is trying to inject a JsonProperty without specifying its name using the `@named('jsonProperty')` annotation."
    );
  }
}
