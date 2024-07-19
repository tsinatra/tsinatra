import {UnexpectedTypeError} from '../../errors/src/serializer/UnexpectedTypeError';
import {Abstract, Newable} from '../../inject/src/annotation/BindingDecorator';
import {injectable} from '../../inject/src/annotation/InjectorAnnotations';
import {Enum} from '../../models/src/Enum';
import {BaseValidator} from './BaseValidator';
import {SerializerOptions} from './SerializerOptions';

/**
 * Represents the deserialized value of a given type.
 */
export type Deserialized<T> =
  | T
  | string
  | number
  | bigint
  | boolean
  | symbol
  | object
  | null
  | undefined;

/**
 * BaseDeserializer is an abstract class that provides deserialization methods for various types.
 * @class
 */
@injectable()
export abstract class BaseDeserializer {
  /**
   * An array of values that are considered truthy.
   *
   * @type {(boolean | string | number)[]}
   */
  private readonly truthyValues: (boolean | string | number)[] = [
    true,
    'true',
    't',
    '1',
    1,
  ];

  /**
   * The function to override in the implementation of BaseSerializer.
   * Deserialize an object into an instance of a class.
   *
   * @template T
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class to deserialize the object into.
   * @param {any} object - The object to deserialize.
   * @param {SerializerOptions} options - The options for the deserializer
   * @return {Deserialized<T>} - The deserialized instance of the class.
   * @protected
   * @abstract
   */
  protected abstract deserializeObject<T>(
    klass: Newable<T> | Abstract<T>,
    object: any,
    options: SerializerOptions
  ): Deserialized<T>;

  /**
   * Deserializes an object of any type, either Array, Set, Map or Single object.
   *
   * @template T - A generic type representing the deserialized object type.
   * @param {Newable<T> | Abstract<T> | object} klass - The class or abstract class constructor function or object used for deserialization.
   * @param {any} object - The object to be deserialized.
   * @param {SerializerOptions} options The options for the deserializer.
   */
  public deserializeAnyType<T>(
    propertyType: Newable<T> | Abstract<T> | object,
    object: any,
    options: SerializerOptions = {}
  ) {
    let deserialized:
      | Deserialized<T>
      | Deserialized<T>[]
      | Set<Deserialized<T>>
      | Map<string, Deserialized<T>>;

    const {
      custom_collection_validation,
      length,
      max_length,
      min_length,
      ...otherValidations
    } = options.validations ?? {};

    const otherOptions = {...options, validations: otherValidations};

    if (options?.isArray) {
      deserialized = this.deserializeArray(propertyType, object, otherOptions);
    } else if (options?.isSet) {
      deserialized = this.deserializeSet(propertyType, object, otherOptions);
    } else if (options?.isMap) {
      deserialized = this.deserializeMap(propertyType, object, otherOptions);
    } else {
      deserialized = this.deserialize(propertyType, object, options);
    }

    if (options.validations) {
      BaseValidator.instance.validateCollection(
        deserialized,
        options.validations
      );
    }

    return deserialized;
  }

  /**
   * Deserializes an object or value based on the provided class or type.
   * This method handles most primitive types.
   *
   * @template T The type of the object or value to be deserialized.
   * @param {Newable<T> | Abstract<T> | object} klass The class or type to deserialize to.
   * @param {any} object The object or value to be deserialized.
   * @param {SerializerOptions} options The options for the deserializer.
   * @returns {Deserialized<T>} The deserialized object or value.
   * @throws {Error} If the object or value cannot be deserialized.
   */
  public deserialize<T>(
    klass: Newable<T> | Abstract<T> | object,
    object: any,
    options: SerializerOptions = {}
  ): Deserialized<T> {
    if (object === undefined || object === null) {
      // If object is undefined or null, we return it immediately, there's no need to keep going.
      return object;
    }

    let deserialized: Deserialized<T>;
    // the strict option should default to true.
    const strict = options.strict ?? true;

    if (klass === Object) {
      // If the class requested is an Object, we return the object as is.
      if (!strict || typeof object === 'object') {
        deserialized = object;
      }
    } else if (klass === String) {
      // IF the class requested is a String, we parse it to string.
      if (!strict || typeof object === 'string') {
        deserialized = `${object}`;
      }
    } else if (klass === Number) {
      // We attempt to parse the Number, we throw an error when it's not a number
      if (!strict || typeof object === 'number') {
        const number = Number(object);
        if (strict && Number.isNaN(number)) {
          throw new UnexpectedTypeError(Number, object);
        }
        deserialized = number;
      }
    } else if (klass === Boolean) {
      // Parsing the boolean by comparing the object against a list of truthy values.
      if (!strict || typeof object === 'boolean') {
        if (typeof object === 'string') {
          deserialized = this.truthyValues.includes(object.toLowerCase());
        } else {
          deserialized = this.truthyValues.includes(object);
        }
      }
    } else if (klass === Symbol) {
      // Deserializes the symbol, looking or creating a new symbol
      if (typeof object === 'string' || typeof object === 'number') {
        deserialized = Symbol.for(`${object}`);
      }
    } else if (klass === BigInt) {
      // BigInt can be created with either bigint, string, number or boolean, but certain strings or numbers throw an error.
      //  we will catch the error and throw a custom one.
      if (
        typeof object === 'bigint' ||
        typeof object === 'string' ||
        typeof object === 'number' ||
        typeof object === 'boolean'
      ) {
        try {
          deserialized = BigInt(object);
        } catch (e) {
          throw new UnexpectedTypeError(BigInt, object);
        }
      }
    } else if (klass === RegExp) {
      if (typeof object === 'string') {
        // We remove the first and last characters of the string
        // these characters are '/' which are used to represent a regular expression
        // We do this because when we call the `toString()` method in a regular expression, they are added.
        deserialized = RegExp(object.slice(1, -1));
      } else if (!strict) {
        deserialized = RegExp(object);
      }
    } else if (klass === Array) {
      // Unfortunately JS doesn't provide any more information in runtime about the type of array we want
      // The best we can do is return an Array of the object as is, if the object is an Array.
      // If we instead want to deserialize an array T[], then we should call the `.deserializeArray` function.
      if (Array.isArray(object)) {
        deserialized = object;
      }
    } else if (klass === Set) {
      // Unfortunately JS doesn't provide any more information in runtime about the type of Set we want
      // The best we can do is return a Set of the object as is, if the object is an Array.
      // If we instead want to deserialize a Set<T>, then we should call the `.deserializeSet` function.
      if (Array.isArray(object)) {
        deserialized = new Set(object);
      }
    } else if (klass === Map) {
      // Unfortunately JS doesn't provide any more information in runtime about the type of Map we want
      // The best we can do is return a Map assuming we have an array of tuples, or an object is converted to a Map.
      // If we instead want to deserialize a Map<string, T>, then we should call the `.deserializeMap` function.
      if (Array.isArray(object)) {
        deserialized = new Map(object);
      } else if (typeof object === 'object') {
        deserialized = new Map(Object.entries(object));
      }
    } else if (
      'name' in klass &&
      (klass.name === 'Date' || klass.name === 'ClockDate')
    ) {
      // We will try to parse the Date using number or a string.
      if (typeof object === 'number' || typeof object === 'string') {
        const date = new Date(object);
        if (strict && Number.isNaN(date.valueOf())) {
          // if it's an invalid date, and we are in strict mode, we throw an error.
          throw new UnexpectedTypeError(Date, object);
        }
        deserialized = date;
      }
    } else if (typeof klass === 'object' && !('prototype' in klass)) {
      // This category also includes object literals, but we don't support those yet.
      // Here we only try to parse an Enum.
      const enumValues = Enum.getValues(klass);

      if (enumValues.includes(object)) {
        deserialized = object;
      } else if (!strict && enumValues.includes(Number(object))) {
        deserialized = Number(object);
      } else if (!strict && enumValues.includes(String(object))) {
        deserialized = String(object);
      }
    } else {
      // This is the 'everything else' part.
      // These should only be custom classes since the type of klass here is only Newable<T> and Abstract<T>
      deserialized = this.deserializeObject(klass, object, options);
    }

    if (deserialized === undefined) {
      throw new UnexpectedTypeError(klass, object);
    } else if (options.validations) {
      BaseValidator.instance.validate(deserialized, options.validations);
    }

    return deserialized;
  }

  /**
   * Deserializes an array of objects into an array of deserialized objects.
   *
   * @template T - A generic type representing the deserialized object type.
   * @param {Newable<T> | Abstract<T> | object} klass - The class or abstract class constructor function or object used for deserialization.
   * @param {any[]} objects - An array of objects to be deserialized.
   * @param {SerializerOptions} options The options for the deserializer.
   * @returns {Deserialized<T>[]} - An array of deserialized objects.
   */
  public deserializeArray<T>(
    klass: Newable<T> | Abstract<T> | object,
    objects: any[],
    options: SerializerOptions = {}
  ): Deserialized<T>[] {
    try {
      // 'Consumes' the `isArray` option.
      const {isArray: _, ...restOfOptions} = options;
      // Here we know that the objects are an array already
      //   we deserialize every element in the array
      return objects.map(object =>
        this.deserialize(klass, object, restOfOptions)
      );
    } catch (e) {
      if (e instanceof Error && e.name !== 'TypeError') {
        throw new UnexpectedTypeError(Array, objects, e);
      } else {
        throw new UnexpectedTypeError(Array, objects);
      }
    }
  }

  /**
   * Deserializes an array of objects and converts it into a Set.
   *
   * @param {Newable<T> | Abstract<T> | object} klass - The class or interface prototype that represents the objects in the array.
   * @param {any[]} arrayOfObjects - The array of serialized objects.
   * @param {SerializerOptions} options The options for the deserializer.
   * @returns {Set<Deserialized<T>>} - The Set of deserialized objects.
   */
  public deserializeSet<T>(
    klass: Newable<T> | Abstract<T> | object,
    arrayOfObjects: any[],
    options: SerializerOptions = {}
  ): Set<Deserialized<T>> {
    // Here we simply deserialize the object as an array, and then convert it to Set.
    try {
      // 'Consumes' the `isSet` option.
      const {isSet: _, ...restOfOptions} = options;

      const serializedArray = this.deserializeArray(
        klass,
        arrayOfObjects,
        restOfOptions
      );
      return new Set(serializedArray);
    } catch (e) {
      if (e instanceof Error) {
        throw new UnexpectedTypeError(Set, arrayOfObjects, e);
      } else {
        throw new UnexpectedTypeError(Set, arrayOfObjects);
      }
    }
  }

  /**
   * Deserializes an object or array into a Map.
   *
   * @template T - The type of values in the Map.
   * @param {Newable<T> | Abstract<T> | object} klass - The class or interface of the Map values.
   * @param {any} object - The object or array to deserialize.
   * @param {SerializerOptions} options The options for the deserializer.
   * @returns {Map<string, Deserialized<T>>} - The deserialized Map.
   * @throws {Error} - If the object cannot be deserialized into a Map.
   */
  public deserializeMap<T>(
    klass: Newable<T> | Abstract<T> | object,
    object: any,
    options: SerializerOptions = {}
  ): Map<string, Deserialized<T>> {
    const map = new Map<string, Deserialized<T>>();

    // the strict option should default to true.
    const strict = options.strict ?? true;

    // A Map constructor takes entries as arguments, so we first obtain the entries by checking if the object is an array
    //   or if the object is an object, we extract its entries.
    let entries: any[];
    if (Array.isArray(object)) {
      entries = object;
    } else if (typeof object === 'object') {
      entries = Object.entries(object);
    } else {
      throw new UnexpectedTypeError(Map, object);
    }

    // 'Consumes' the `isMap` option.
    const {isMap: _, ...restOfOptions} = options;

    // Now we iterate over each of these entries, and start populating our resulting map.
    for (const keyValuePair of entries) {
      // We need to validate that each entry is an Array, which should be a key value pair.
      // if we are not in strict mode, the number of elements doesn't matter, we will only use the first 2
      // if we are in strict mode, it must be exactly 2 elements, the key and the value
      if (
        Array.isArray(keyValuePair) &&
        (!strict || keyValuePair.length === 2)
      ) {
        // key is at position 0
        const key = keyValuePair[0].toString();
        // value is at position 1, and we deserialize it
        const value = this.deserializeAnyType(
          klass,
          keyValuePair[1],
          restOfOptions
        );
        // Add the key, value pair to the map
        map.set(key, value);
      } else {
        // We throw an error upon finding an invalid key-value pair
        throw new UnexpectedTypeError(Map, object);
      }
    }

    return map;
  }
}
