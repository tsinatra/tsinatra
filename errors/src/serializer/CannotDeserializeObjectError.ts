import {ValidationError} from '../validation/ValidationError';

export class CannotDeserializeObjectError extends ValidationError {
  constructor(className: string) {
    super(`Cannot deserialize object of type '${className}'`);
  }
}
