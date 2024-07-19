import {ValidationError} from '../validation/ValidationError';

export class WrapperClassMustContainOnlyOneArgumentError extends ValidationError {
  constructor(className: string) {
    super(
      `@serializable({isWrapper: true}) decorated class '${className}' cannot contain more than 1 argument.`
    );
  }
}
