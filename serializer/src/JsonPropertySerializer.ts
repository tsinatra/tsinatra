import {getClassNameOf} from '../../utils';
import {interfaces, METADATA_KEY} from 'inversify';
import {MissingJsonPropertyAnnotationsError} from '../../errors/src/serializer/MissingJsonPropertyAnnotationsError';
import {BindingDecorator} from '../../inject/src/annotation/BindingDecorator';
import {SerializableOptions} from '../../inject/src/annotation/SerializableAnnotation';
import {ApiBinding} from '../../inject/src/bindings/ApiBinding';
import {BaseSerializer} from './BaseSerializer';
import {JsonPropertyDeserializerOptions} from './JsonPropertyDeserializer';
import {SerializerOptions} from './SerializerOptions';

// Interface used for the `hasSerializeFn` typeguard.
interface Serializable {
  serialize(): object;
}

/**
 * Implementation of BaseSerializer, customized for this framework.
 *
 * This serializer is capable of serializing objects with `@jsonProperty` annotations, or with `serialize()` method.
 *
 * The order of preference for the serializer is:
 * 1. `@serializable()` annotation with `@jsonProperty` tags
 * 2. `serialize()` method in the object
 * 3. `@jsonProperty` tags without `@serializable()` annotation
 * 4. Returns the same object and lets `JSON.stringify` decide
 */
export class JsonPropertySerializer extends BaseSerializer {
  static instance = new JsonPropertySerializer();

  private constructor() {
    super();
  }

  /**
   * This implementation is in charge of the serialization of the object following our order of precedence.
   * The preference is:
   * 1. `@serializable()` decorator with `@jsonProperty()` tags.
   * 2. `serialize()` method in the object.
   * 3. `@jsonProperty()` tags without `@serializable()` decorator
   * 4. returns the same object.
   *
   * @param object
   * @param options
   * @protected
   */
  protected serializeObject(
    object: object,
    parentOptions: SerializerOptions = {}
  ): any {
    const serializableOptions: SerializableOptions | undefined =
      Reflect.getMetadata(BindingDecorator.serializableTag, object.constructor);

    if (serializableOptions) {
      return this.serializeObjectUsingMetadatas(
        object,
        parentOptions,
        serializableOptions
      );
    } else if (this.hasSerializeFn(object)) {
      // Has `serialize` function
      return object.serialize();
    } else {
      try {
        return this.serializeObjectUsingMetadatas(object, parentOptions);
      } catch (e) {
        return object;
      }
    }
  }

  /**
   * Typeguard function for the `Serializable` interface
   *
   * @param object
   * @private
   */
  private hasSerializeFn(object: object): object is Serializable {
    return 'serialize' in object && typeof object.serialize === 'function';
  }

  /**
   * This method is in charge of serializing our object given the `@jsonProperty` decorators.
   * It's in charge of validating that there is at least 1 decorator,
   *  otherwise it attempts to use the `serialize` function.
   *  if `serialize` function is not present, we throw an error.
   *
   * The method itself is aware of the `.` propertyName special case.
   *
   * @param object
   * @private
   */
  private serializeObjectUsingMetadatas(
    object: any,
    parentOptions: SerializerOptions = {},
    serializableOptions?: SerializableOptions
  ): any {
    const metadatas = [
      ...this.getJsonPropertyMetadatas(object.constructor),
      ...this.getJsonAttributeMetadatas(object.constructor),
    ];

    if (metadatas.length === 0) {
      if (this.hasSerializeFn(object)) {
        return object.serialize();
      } else if (serializableOptions?.allowEmpty) {
        return {};
      } else {
        throw new MissingJsonPropertyAnnotationsError(getClassNameOf(object));
      }
    }

    if (serializableOptions?.isWrapper && metadatas.length > 1) {
      throw new Error('Wrapper class has more than 1 argument.');
    }

    // We will create a new object, and start assigning the field values to it from our object.
    // The `@jsonProperty` decorator provides metadata for the jsonFieldName and the paramName from the object.
    const serializedObject: {[key: string]: any} = {};
    let wrappedObject = undefined;

    metadatas.forEach(fieldMetadatas => {
      const namedMetadata = fieldMetadatas.find(
        metadata => metadata.key === METADATA_KEY.NAMED_TAG
      );
      const paramNameMetadata = fieldMetadatas.find(
        metadata => metadata.key === BindingDecorator.parameterNameTag
      );
      const jsonPropertyOptionsMetadata = fieldMetadatas.find(
        metadata => metadata.key === BindingDecorator.optionsTag
      );

      if (namedMetadata && paramNameMetadata) {
        const jsonFieldName = namedMetadata.value as string;
        const paramName = paramNameMetadata.value as string;
        const jsonPropertyOptions: JsonPropertyDeserializerOptions =
          jsonPropertyOptionsMetadata?.value ?? {};

        if (
          serializableOptions?.isWrapper &&
          !parentOptions.ignoreWrap &&
          paramName in object
        ) {
          // if isWrapper, then we already have the guarantee from the check above that there's only 1 argument.
          wrappedObject = this.serialize(
            object[paramName],
            jsonPropertyOptions
          );
        } else if (jsonPropertyOptions.isStringified && paramName in object) {
          serializedObject[jsonFieldName] = JSON.stringify(
            this.serialize(object[paramName], jsonPropertyOptions)
          );
        } else if (paramName in object) {
          serializedObject[jsonFieldName] = this.serialize(
            object[paramName],
            jsonPropertyOptions
          );
        }
      }
    });

    return serializableOptions?.isWrapper && !parentOptions.ignoreWrap
      ? wrappedObject
      : this.sortObject(serializedObject);
  }

  /**
   * This method is in charge of fetching all the metadatas generated by the `@jsonProperty` of a given target.
   *
   * @param target
   * @private
   */
  private getJsonPropertyMetadatas(target: any): interfaces.Metadata[][] {
    if (target === undefined) return [];

    const taggedMetadata = Reflect.getMetadata(METADATA_KEY.TAGGED, target);
    if (taggedMetadata === undefined) return [];

    const annotations = Object.values(
      taggedMetadata as object
    ) as interfaces.Metadata[][];

    const jsonPropertyMetadatas = annotations.filter(metadatas => {
      const typeMetadata = metadatas.find(
        metadata => metadata.key === METADATA_KEY.INJECT_TAG
      );
      return typeMetadata && typeMetadata.value === ApiBinding.JsonProperty;
    });

    return jsonPropertyMetadatas;
  }

  /**
   * This method is in charge of fetching all the metadatas generated by the `@jsonAttribute` of a given target.
   *
   * @param target
   * @private
   */
  private getJsonAttributeMetadatas(target: any): interfaces.Metadata[][] {
    if (target === undefined) return [];

    const taggedMetadata = Reflect.getMetadata(
      BindingDecorator.jsonAttributesTag,
      target
    );
    if (taggedMetadata === undefined) return [];

    const annotations = Object.values(
      taggedMetadata as object
    ) as interfaces.Metadata[][];

    return annotations;
  }

  /**
   * Helper method to sort the object alphabetically.
   *
   * @param object
   * @private
   */
  private sortObject(object: Record<string, any>): Record<string, any> {
    return Object.keys(object)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = object[key];
          return acc;
        },
        {} as Record<string, any>
      );
  }
}
