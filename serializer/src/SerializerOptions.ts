import {Newable} from '../../inject/src/annotation/BindingDecorator';

/**
 * Represents the options that the serializer can receive.
 */
export interface SerializerOptions {
  // Indicates if the property is an Array. Default: false
  isArray?: boolean;
  // Indicates if the property is a Set. Default: false
  isSet?: boolean;
  // Indicates if the property is a Map. Default: false
  isMap?: boolean;
  // Indicates if the property is Optional (can be null or undefined). Default: false
  isOptional?: boolean;
  // Indicates if the property is Stringified instead of being an object. Default: false
  isStringified?: boolean;
  // If the property being deserialized has the isWrapper option, this indicates that we should ignore that option. Default: false.
  ignoreWrap?: boolean;
  // Indicates if the value should be strict or implicitly converted to their target types. Default: true
  strict?: boolean;
  // Indicates the subtypes of any abstract or super class. Default: {}
  subTypes?: SerializerSubTypeOptions;
  // Validations
  validations?: SerializerValidations;
}

export interface SerializerSubTypeOptions {
  // Indicates the field from the object that is used to determine the type.
  typeProperty: string;
  // A map from typeField name to Service Identifier.
  typeMap: Record<string, Newable<unknown> | object>;
}

export interface SerializerValidations {
  less_than?: number | bigint;
  less_or_equal_than?: number | bigint;
  greater_than?: number | bigint;
  greater_or_equal_than?: number | bigint;
  length?: number;
  min_length?: number;
  max_length?: number;
  pattern?: RegExp;
  custom_validation?: (obj: any) => boolean;
  custom_collection_validation?: (obj: any) => boolean;
}
