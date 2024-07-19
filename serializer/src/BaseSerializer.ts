import {getClassNameOf} from '../../utils';
import {UnserializableTypeError} from '../../errors/src/serializer/UnserializableTypeError';
import {injectable} from '../../inject/src/annotation/InjectorAnnotations';
import {SerializerOptions} from './SerializerOptions';

/**
 * Base class to create Serializers.
 *
 * This serializer knows how to serialize most primitive values, but provides the opportunity to define custom
 * logic for serializing complex objects.
 */
@injectable()
export abstract class BaseSerializer {
  /**
   * The function to override in the implementation of BaseSerializer.
   * It receives an object that is guaranteed to not be an Array, nor a null.
   *
   * @param {object} object - The object to be serialized.
   * @param {SerializerOptions} options The options for the deserializer.
   * @protected
   * @returns {unknown} - The serialized representation of the object.
   * @abstract
   */
  protected abstract serializeObject(
    object: object,
    options: SerializerOptions
  ): unknown;

  /**
   * Serializes the given object into a JSON-like format.
   *
   * @param {any} object - The object to be serialized.
   *
   * @return {unknown} - The serialized object in JSON-like format.
   */
  public serialize(object: any, options: SerializerOptions = {}): unknown {
    switch (getClassNameOf(object)) {
      case 'Undefined':
      case 'Boolean':
      case 'Number':
      case 'String':
      case 'Null':
        return object;
      case 'Symbol':
        return object.description;
      case 'BigInt':
      case 'RegExp':
        return object.toString();
      case 'Array':
      case 'Set':
        return Array.from(object).map(obj => this.serialize(obj, options));
      case 'Map': {
        const serializedMap: Record<string, unknown> = {};

        (object as Map<any, any>).forEach((value, key) => {
          serializedMap[key.toString()] = this.serialize(value, options);
        });

        return serializedMap;
      }
      case 'Date':
        return (object as Date).getTime();
      case 'Function':
        throw new UnserializableTypeError(object);
      default:
        // Here we handle the custom classes
        return this.serializeObject(object, options);
    }
  }
}
