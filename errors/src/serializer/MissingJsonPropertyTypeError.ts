import {ValidationError} from '../validation/ValidationError';

export class MissingJsonPropertyTypeError extends ValidationError {
  constructor() {
    super(
      "`ApiBinding.JsonProperty` is trying to inject a JsonProperty without specifying its type using the `@tagged('binding:type', Type)` annotation."
    );
  }
}
