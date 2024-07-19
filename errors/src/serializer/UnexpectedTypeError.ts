import {getClassNameOf} from '../../../utils';
import {
  Abstract,
  Newable,
} from '../../../inject/src/annotation/BindingDecorator';
import {ValidationError} from '../validation/ValidationError';

export class UnexpectedTypeError extends ValidationError {
  constructor(
    klass: Newable<unknown> | Abstract<unknown> | object,
    object: any,
    error?: Error
  ) {
    const klassName =
      typeof klass === 'function' ? klass.name : JSON.stringify(klass);
    const objectClassName = getClassNameOf(object);
    const stringifiedObject =
      typeof object === 'bigint' ? object.toString() : JSON.stringify(object);
    super(
      `Unexpected Type while deserializing object with expected type '${klassName}'.\n` +
        `Found an object of type '${objectClassName}' instead: ${stringifiedObject}.` +
        (error ? `\nContext: ${error?.message}` : '')
    );
  }
}
