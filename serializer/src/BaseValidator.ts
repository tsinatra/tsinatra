import {injectable} from 'inversify';
import {ValidationError} from '../../errors/src/validation/ValidationError';
import {SerializerValidations} from './SerializerOptions';

@injectable()
export class BaseValidator {
  static instance = new BaseValidator();

  public validate(object: any, validations: SerializerValidations): void {
    this.validateCollection(object, validations);

    if (typeof object === 'number' || typeof object === 'bigint') {
      if (validations.less_than && object >= validations.less_than) {
        throw new ValidationError(
          `Expected '${object}' to be less than '${validations.less_than}'`
        );
      }

      if (
        validations.less_or_equal_than &&
        object > validations.less_or_equal_than
      ) {
        throw new ValidationError(
          `Expected '${object}' to be less or equal than '${validations.less_or_equal_than}'`
        );
      }

      if (validations.greater_than && object <= validations.greater_than) {
        throw new ValidationError(
          `Expected '${object}' to be greater than '${validations.greater_than}'`
        );
      }

      if (
        validations.greater_or_equal_than &&
        object < validations.greater_or_equal_than
      ) {
        throw new ValidationError(
          `Expected '${object}' to be greater or equal than '${validations.greater_or_equal_than}'`
        );
      }
    }

    if (
      typeof object === 'string' &&
      validations.pattern &&
      !validations.pattern.test(object)
    ) {
      throw new ValidationError(
        `Expected '${object}' to match pattern '${validations.pattern}'`
      );
    }

    if (
      validations.custom_validation &&
      !validations.custom_validation(object)
    ) {
      throw new ValidationError(
        `Expected '${String(object)}' to satisfy custom validation`
      );
    }
  }

  public validateCollection(
    object: any,
    validations: SerializerValidations
  ): void {
    if (
      typeof object === 'string' ||
      Array.isArray(object) ||
      object instanceof Set ||
      object instanceof Map
    ) {
      if (
        typeof object !== 'string' &&
        validations.custom_collection_validation &&
        !validations.custom_collection_validation(object)
      ) {
        throw new ValidationError(
          `Expected '${object}' to satisfy custom collection validation`
        );
      }

      let length: number;
      if (typeof object === 'string' || Array.isArray(object)) {
        length = object.length;
      } else {
        length = object.size;
      }

      if (validations.length && length !== validations.length) {
        throw new ValidationError(
          `Expected '${object}' to be have length '${validations.length}', but it has length '${length}'`
        );
      }

      if (validations.min_length && length < validations.min_length) {
        throw new ValidationError(
          `Expected '${object}' to be have minimum length '${validations.min_length}', but it has length '${length}'`
        );
      }

      if (validations.max_length && length > validations.max_length) {
        throw new ValidationError(
          `Expected '${object}' to be have maximum length '${validations.max_length}', but it has length '${length}'`
        );
      }
    }
  }
}
