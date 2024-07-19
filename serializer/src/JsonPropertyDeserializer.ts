import {getClassNameOf} from '../../utils';
import {CannotDeserializeAbstractTypeError} from '../../errors/src/serializer/CannotDeserializeAbstractTypeError';
import {CannotDeserializeObjectError} from '../../errors/src/serializer/CannotDeserializeObjectError';
import {MissingJsonPropertyAnnotationsError} from '../../errors/src/serializer/MissingJsonPropertyAnnotationsError';
import {MissingJsonPropertyNameError} from '../../errors/src/serializer/MissingJsonPropertyNameError';
import {MissingJsonPropertyTypeError} from '../../errors/src/serializer/MissingJsonPropertyTypeError';
import {MissingRequiredJsonPropertyError} from '../../errors/src/serializer/MissingRequiredJsonPropertyError';
import {MissingSubTypeFromClassToDeserializeError} from '../../errors/src/serializer/MissingSubTypeFromClassToDeserializeError';
import {UnexpectedTypeError} from '../../errors/src/serializer/UnexpectedTypeError';
import {WrapperClassMustContainOnlyOneArgumentError} from '../../errors/src/serializer/WrapperClassMustContainOnlyOneArgumentError';
import {
  Abstract,
  BindingDecorator,
  Newable,
} from '../../inject/src/annotation/BindingDecorator';
import {
  interfaces,
  METADATA_KEY,
} from '../../inject/src/annotation/InjectorAnnotations';
import {SerializableOptions} from '../../inject/src/annotation/SerializableAnnotation';
import {ApiBinding} from '../../inject/src/bindings/ApiBinding';
import {BaseDeserializer, Deserialized} from './BaseDeserializer';
import {SerializerOptions} from './SerializerOptions';

/**
 * Represents the options that the JsonPropertyDeserializer can receive.
 */
export interface JsonPropertyDeserializerOptions extends SerializerOptions {
  // The Json Property name of the attribute we are annotating. Default: The attribute name defined in the class.
  propertyName?: string;
}

/**
 * Implementation of BaseSerializer, customized for this framework.
 *
 * This serializer is capable of serializing objects with `@jsonProperty` annotations, or with `serialize()` method.
 *
 * The order of preference for the serializer is:
 * 1. `@serializable()` annotation with `@jsonProperty` tags
 * 2. `deserialize()` method in the class we want to deserialize into
 * 3. `@jsonProperty` tags without `@serializable()` annotation
 * 4. throws an Error
 */
export class JsonPropertyDeserializer extends BaseDeserializer {
  static instance = new JsonPropertyDeserializer();

  protected constructor() {
    super();
  }

  /**
   * Deserialize the given object using the provided class and options.
   * This is the order in which it will attempt the deserialization:
   * 1. If the `klass` has a `@serializable` annotation, it will attempt to use the `@jsonProperty` annotations
   * 2. If the `klass` has a `deserialize` function, it will use it to deserialize.
   * 3. otherwise it will optimistically attempt to use the `@jsonProperty` annotations
   * 4. ultimately if none of the previous cases were satisfied, it throws an error
   *
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class to deserialize the object into.
   * @param {any} object - The object to deserialize.
   * @param {boolean} strict - Specifies whether strict deserialization should be performed.
   * @returns {Deserialized<T>} - The deserialized object.
   * @protected
   */
  protected deserializeObject<T>(
    klass: Newable<T> | Abstract<T>,
    object: any,
    parentOptions: JsonPropertyDeserializerOptions = {}
  ): Deserialized<T> {
    const serializableOptions: SerializableOptions | undefined =
      Reflect.getMetadata(BindingDecorator.serializableTag, klass);

    if (serializableOptions) {
      return this.deserializeObjectUsingMetadatas(
        klass,
        object,
        serializableOptions,
        parentOptions
      );
    } else if (
      'deserialize' in klass &&
      typeof klass.deserialize === 'function'
    ) {
      // Use `deserialize` function from class.
      return klass.deserialize(object);
    } else {
      try {
        return this.deserializeObjectUsingMetadatas(
          klass,
          object,
          {},
          parentOptions
        );
      } catch (e) {
        if (e instanceof MissingJsonPropertyAnnotationsError) {
          // This object is not decorated, so we need a different error.
          throw new CannotDeserializeObjectError(
            typeof klass === 'function' ? klass.name : getClassNameOf(object)
          );
        }
        throw e;
      }
    }
  }

  /**
   * Attempts to Deserialize an object using the `@jsonProperty` metadatas.
   * If there are no `@jsonProperty` metadatas, then it will handle that case separate.
   *
   * @template T
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class to deserialize the object into.
   * @param {any} object - The object to deserialize.
   * @param {boolean} strict - Indicates whether to strictly deserialize the object or not.
   * @param {SerializableOptions} [serializableOptions] - The options for deserialization.
   * @returns {Deserialized<T>} - The deserialized object.
   * @private
   */
  private deserializeObjectUsingMetadatas<T>(
    klass: Newable<T> | Abstract<T>,
    object: any,
    serializableOptions: SerializableOptions = {},
    parentOptions: JsonPropertyDeserializerOptions = {}
  ): Deserialized<T> {
    // If the property was stringified, we need to parse it into an object.
    if (parentOptions.isStringified) {
      object = JSON.parse(object);
    }

    const klassToDeserialize: Newable<unknown> | Abstract<unknown> | object =
      parentOptions.subTypes
        ? this.getJsonPropertySubType(klass, object, parentOptions)
        : klass;

    const metadatas = this.getJsonPropertyMetadatas(klassToDeserialize);
    const className =
      typeof klassToDeserialize === 'function'
        ? klassToDeserialize.name
        : getClassNameOf(object);

    if (!metadatas) {
      return this.handleLackOfMetadatas(
        klassToDeserialize,
        object,
        serializableOptions,
        className
      );
    }

    if (serializableOptions.isWrapper && metadatas.length > 1) {
      throw new WrapperClassMustContainOnlyOneArgumentError(className);
    }

    const args: any[] = [];

    Array.from(metadatas).forEach((fieldMetadatas, index) => {
      const propertyName = this.getJsonPropertyName(fieldMetadatas);
      let propertyOptions = this.getJsonPropertyOptions(fieldMetadatas);
      let propertyType = this.getJsonPropertyType(fieldMetadatas);

      if (propertyName && propertyType) {
        let arg;
        if (serializableOptions.isWrapper && !parentOptions.ignoreWrap) {
          arg = object;
        } else if (propertyOptions.isStringified) {
          // 'consumes' the `isStringified` option
          const {isStringified: _, ...restOfOptions} = propertyOptions;
          propertyOptions = restOfOptions;
          arg = JSON.parse(object[propertyName]);
        } else {
          arg = object[propertyName];
        }

        if (propertyOptions.subTypes && !Array.isArray(arg)) {
          propertyType = this.getJsonPropertySubType(
            propertyType,
            arg,
            propertyOptions
          );
        }

        const deserializedArg = this.deserializeAnyType(
          propertyType,
          arg,
          propertyOptions
        );

        if (
          (deserializedArg !== undefined && deserializedArg !== null) ||
          this.isOptionalField(fieldMetadatas, propertyOptions)
        ) {
          args[index] = deserializedArg;
        } else {
          throw new MissingRequiredJsonPropertyError(
            propertyName,
            klassToDeserialize,
            arg,
            propertyOptions
          );
        }
      }
    });

    if (typeof klassToDeserialize === 'function') {
      try {
        return Reflect.construct(klassToDeserialize, args);
      } catch (e) {
        if (serializableOptions?.isWrapper) {
          throw new UnexpectedTypeError(
            klassToDeserialize,
            args[0],
            e as Error
          );
        } else {
          throw new UnexpectedTypeError(klassToDeserialize, args, e as Error);
        }
      }
    } else {
      // We shouldn't have an Abstract class here
      throw new CannotDeserializeAbstractTypeError();
    }
  }

  /**
   * This method is in charge of fetching all the metadatas generated by the `@jsonProperty` of a given target.
   *
   * @param target
   * @private
   */
  private getJsonPropertyMetadatas(
    target: any
  ): interfaces.Metadata[][] | undefined {
    if (target === undefined) return undefined;

    const taggedMetadata = Reflect.getMetadata(METADATA_KEY.TAGGED, target);
    if (taggedMetadata === undefined) return undefined;

    const annotations = Object.values(
      taggedMetadata as object
    ) as interfaces.Metadata[][];

    const jsonPropertyMetadatas = annotations.filter(metadatas => {
      const typeMetadata = metadatas.find(
        metadata => metadata.key === METADATA_KEY.INJECT_TAG
      );
      return typeMetadata && typeMetadata.value === ApiBinding.JsonProperty;
    });

    return jsonPropertyMetadatas.length > 0 ? jsonPropertyMetadatas : undefined;
  }

  /**
   * Returns the name of the JSON property associated with the given field metadatas.
   *
   * @param {interfaces.Metadata[]} fieldMetadatas - The metadata of the field.
   * @returns {string} - The name of the JSON property.
   * @throws {MissingJsonPropertyNameError} - Thrown when the JSON property name is missing.
   */
  public getJsonPropertyName(fieldMetadatas: interfaces.Metadata[]): string {
    const propertyName = fieldMetadatas.find(
      metadata => metadata.key === METADATA_KEY.NAMED_TAG
    )?.value;

    if (!propertyName) {
      throw new MissingJsonPropertyNameError();
    }

    return propertyName as string;
  }

  /**
   * Returns the type of the JSON property based on the given metadatas and options.
   * This method also resolves subTypes based on a discriminator field in the object for resolving Abstract types
   *
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class that we are trying to deserialize.
   * @param {interfaces.Metadata[]} fieldMetadatas - The metadata of the fields.
   * @param {any} object - The object containing the property.
   * @param {JsonPropertyDeserializerOptions} propertyOptions - The options for the JSON property.
   * @returns {Newable<unknown> | Abstract<unknown> | object} - The type of the JSON property.
   * @throws {Error} - If the type discriminator is not found in the incoming object or the property type is not found.
   */
  public getJsonPropertyType(
    fieldMetadatas: interfaces.Metadata[]
  ): Newable<unknown> | Abstract<unknown> | object {
    const propertyTypeMetadata = fieldMetadatas.find(
      metadata => metadata.key === BindingDecorator.typeTag
    );

    const propertyType =
      propertyTypeMetadata &&
      (propertyTypeMetadata.value as
        | Newable<unknown>
        | Abstract<unknown>
        | object);

    if (!propertyType) {
      throw new MissingJsonPropertyTypeError();
    }

    return propertyType;
  }

  /**
   * Returns the type of the JSON property based on the given metadatas and options.
   * This method also resolves subTypes based on a discriminator field in the object for resolving Abstract types
   *
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class that we are trying to deserialize.
   * @param {interfaces.Metadata[]} fieldMetadatas - The metadata of the fields.
   * @param {any} object - The object containing the property.
   * @param {JsonPropertyDeserializerOptions} propertyOptions - The options for the JSON property.
   * @returns {Newable<unknown> | Abstract<unknown> | object} - The type of the JSON property.
   * @throws {Error} - If the type discriminator is not found in the incoming object or the property type is not found.
   */
  public getJsonPropertySubType(
    propertyType: object | Newable<unknown> | Abstract<unknown>,
    object: any,
    propertyOptions: JsonPropertyDeserializerOptions
  ): Newable<unknown> | Abstract<unknown> | object {
    if (propertyOptions.subTypes && propertyOptions.subTypes.typeProperty) {
      // if we are parsing an abstract type, and it has a map of types, resolve the specific type.
      const typeDiscriminator = object[propertyOptions.subTypes.typeProperty];
      // if the type discriminator is not found, we throw an error.
      if (typeDiscriminator === undefined) {
        throw new MissingRequiredJsonPropertyError(
          propertyOptions.subTypes.typeProperty,
          String,
          object,
          propertyOptions
        );
      }

      // Now that we know the type discriminator, let's try to get the type from our mapping.
      const subType = propertyOptions.subTypes.typeMap[typeDiscriminator];

      // If the typeDiscriminator is not in the mapping that's an error.
      if (!subType) {
        throw new MissingSubTypeFromClassToDeserializeError(
          propertyType,
          typeDiscriminator
        );
      }

      return subType;
    } else {
      throw new Error(
        'Attempted to obtain the subType, but the options are not set correctly.'
      );
    }
  }

  /**
   * Returns the options for a JSON property based on the given field metadatas.
   * If no options are defined, an empty object is returned.
   *
   * @param {interfaces.Metadata[]} fieldMetadatas - The field metadatas to extract the options from.
   * @returns {JsonPropertyDeserializerOptions} - The options for the JSON property.
   */
  public getJsonPropertyOptions(
    fieldMetadatas: interfaces.Metadata[]
  ): JsonPropertyDeserializerOptions {
    const propertyOptionsMetadata = fieldMetadatas.find(
      metadata => metadata.key === BindingDecorator.optionsTag
    );

    if (!propertyOptionsMetadata) {
      // If we don't have options define, we can return an empty object.
      return {subTypes: undefined} as JsonPropertyDeserializerOptions;
    }

    return propertyOptionsMetadata.value as JsonPropertyDeserializerOptions;
  }

  /**
   * Determines if a field is optional based on the provided field metadata and property options.
   *
   * @param {interfaces.Metadata[]} fieldMetadatas - The metadata of the field.
   * @param {JsonPropertyDeserializerOptions} propertyOptions - The options of the property.
   * @returns {boolean} - True if the field is optional, false otherwise.
   * @private
   */
  public isOptionalField(
    fieldMetadatas: interfaces.Metadata[],
    propertyOptions: JsonPropertyDeserializerOptions
  ): boolean {
    return (
      propertyOptions.isOptional ||
      fieldMetadatas.find(
        metadata => metadata.key === METADATA_KEY.OPTIONAL_TAG
      )?.value === true
    );
  }

  /**
   * Handles the lack of metadatas for deserialization.
   * 1. If the `klass` has a `deserialize` function, it will use that.
   * 2. If the `serializableOptions` allow for an empty klass, it will return an empty object.
   * 3. Throws an error.
   *
   * @param {Newable<T> | Abstract<T>} klass - The class or abstract class to deserialize into.
   * @param {any} object - The serialized object.
   * @param {boolean} strict - Indicates if strict deserialization is enabled.
   * @param {SerializableOptions | undefined} serializableOptions - Serializable options for deserialization.
   * @param {string} className - The name of the class.
   * @returns {Deserialized<T>} - The deserialized object.
   * @private
   */
  private handleLackOfMetadatas<T>(
    klass: Newable<T> | Abstract<T> | object,
    object: any,
    serializableOptions: SerializableOptions,
    className: string
  ): Deserialized<T> {
    if ('deserialize' in klass && typeof klass.deserialize === 'function') {
      // Use `deserialize` function from class.
      return klass.deserialize(object);
    } else if (serializableOptions.allowEmpty && typeof klass === 'function') {
      return Reflect.construct(klass, []);
      // TODO: Handle Abstract class
      // } else if() {
    } else {
      throw new MissingJsonPropertyAnnotationsError(className);
    }
  }
}
