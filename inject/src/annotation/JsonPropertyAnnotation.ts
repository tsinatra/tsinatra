import {interfaces} from 'inversify';
import {DecoratorTarget} from 'inversify/lib/annotation/decorator_utils';
import {Metadata} from 'inversify/lib/planning/metadata';
import {JsonPropertyDeserializerOptions} from '../../../serializer/src/JsonPropertyDeserializer';
import {ApiBinding} from '../bindings/ApiBinding';
import {BindingDecorator, BindingType} from './BindingDecorator';

export const jsonProperty = (
  // The type that our property should map to
  bindingType: BindingType,
  jsonPropertyOptions?: JsonPropertyDeserializerOptions
) =>
  BindingDecorator.createTypeTaggedNamedInjectDecorator(
    ApiBinding.JsonProperty,
    bindingType,
    jsonPropertyOptions?.propertyName,
    jsonPropertyOptions
  );

export const jsonAttribute = (
  jsonPropertyOptions?: Pick<
    JsonPropertyDeserializerOptions,
    'propertyName' | 'isStringified'
  >
) => {
  return <T>(
    target: DecoratorTarget,
    targetKey?: string | symbol,
    propertyDescriptor?: number | TypedPropertyDescriptor<T>
  ) => {
    if (
      // The propertyDescriptor will be a number when it's describing a constructor
      typeof propertyDescriptor === 'number' ||
      // The propertyDescriptor will be undefined when it's describing an attribute
      // And it will be defined for functions, so if it's defined we check if it's a getter.
      (propertyDescriptor && propertyDescriptor.get === undefined)
    ) {
      throw new Error(
        '@jsonAttribute annotation can only be applied to getter functions, or attributes.'
      );
    }

    const metadatas = [
      new Metadata(BindingDecorator.optionsTag, jsonPropertyOptions),
      new Metadata(BindingDecorator.parameterNameTag, targetKey),
      new Metadata(
        BindingDecorator.namedTag,
        jsonPropertyOptions?.propertyName ?? targetKey
      ),
    ];

    const annotationTarget = target.constructor;

    // Read existing jsonAttributes if defined
    const existingTargetMetadata =
      Reflect.getMetadata(
        BindingDecorator.jsonAttributesTag,
        annotationTarget
      ) ?? {};

    // Read existing metadata for the attribute
    const attributeMetadata: interfaces.Metadata[] =
      existingTargetMetadata[targetKey as string] ?? [];

    // Add new metadatas to the attribute
    attributeMetadata.push(...metadatas);
    // Assign metadatas to the jsonAttributes object
    existingTargetMetadata[targetKey as string] = attributeMetadata;

    // Assign metadata to the target
    Reflect.defineMetadata(
      BindingDecorator.jsonAttributesTag,
      existingTargetMetadata,
      annotationTarget
    );
  };
};
