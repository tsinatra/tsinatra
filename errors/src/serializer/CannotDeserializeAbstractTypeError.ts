import {ValidationError} from '../validation/ValidationError';

export class CannotDeserializeAbstractTypeError extends ValidationError {
  constructor() {
    super('@serializable() decorated Abstract class cannot be deserialized');
  }
}
