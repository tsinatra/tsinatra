import {
  Abstract,
  Newable,
} from '../../../inject/src/annotation/BindingDecorator';
import {ValidationError} from '../validation/ValidationError';

export class MissingSubTypeFromClassToDeserializeError extends ValidationError {
  constructor(
    klass: Newable<unknown> | Abstract<unknown> | object,
    typeDiscriminator: string,
    propertyName?: string
  ) {
    const klassName =
      typeof klass === 'function' ? klass.name : JSON.stringify(klass);
    const propertyOrObject = propertyName
      ? `property '${propertyName}'`
      : 'object';
    super(
      `Missing subType '${typeDiscriminator}' definition in @jsonProperty annotation ` +
        `while trying to parse ${propertyOrObject} of type '${klassName}'`
    );
  }
}
