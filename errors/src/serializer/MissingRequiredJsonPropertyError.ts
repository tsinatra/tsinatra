import {
  Abstract,
  Newable,
} from '../../../inject/src/annotation/BindingDecorator';
import {JsonPropertyDeserializerOptions} from '../../../serializer/src/JsonPropertyDeserializer';
import {ValidationError} from '../validation/ValidationError';

export class MissingRequiredJsonPropertyError extends ValidationError {
  constructor(
    propertyName: string,
    klass: Newable<unknown> | Abstract<unknown> | object,
    object: any,
    propertyOptions: JsonPropertyDeserializerOptions = {}
  ) {
    const klassName = typeof klass === 'function' ? klass.name : klass;
    const expectedType = propertyOptions.isArray
      ? `${klassName}[]`
      : `${klassName}`;

    super(
      `Missing required @jsonProperty '${propertyName}' with expected type '${expectedType}' ` +
        `in ${typeof object}: ${JSON.stringify(object)}`
    );
  }
}
