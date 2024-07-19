import {ValidationError} from '../validation/ValidationError';

export class MissingJsonPropertyAnnotationsError extends ValidationError {
  constructor(className: string) {
    super(
      `@serializable() decorated object of type '${className}' doesn't contain any '@jsonProperty' annotations`
    );
  }
}
