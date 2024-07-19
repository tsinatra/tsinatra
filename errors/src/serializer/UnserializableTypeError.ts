import {ValidationError} from '../validation/ValidationError';

export class UnserializableTypeError extends ValidationError {
  constructor(object: any) {
    super(`Unserializable Type: ${object}`);
  }
}
