import {Abstract, Newable} from '../../inject/src/annotation/BindingDecorator';
import {
  JsonPropertyDeserializer,
  JsonPropertyDeserializerOptions,
} from './JsonPropertyDeserializer';
import {JsonPropertySerializer} from './JsonPropertySerializer';
import {SerializerOptions} from './SerializerOptions';

export class TsinatraSerializer {
  static serializer = JsonPropertySerializer.instance;
  static deserializer = JsonPropertyDeserializer.instance;

  static serialize(object: any, options: SerializerOptions = {}): unknown {
    return TsinatraSerializer.serializer.serialize(object, options);
  }

  static deserialize<T>(
    klass: Newable<T> | Abstract<T> | object,
    object: any | any[],
    options: JsonPropertyDeserializerOptions = {}
  ) {
    return TsinatraSerializer.deserializer.deserializeAnyType(klass, object, {
      isArray: klass !== Array && Array.isArray(object),
      ...options,
    });
  }

  static stringify(object: any, options: SerializerOptions = {}) {
    return JSON.stringify(TsinatraSerializer.serialize(object, options));
  }

  static parse<T>(
    klass: Newable<T> | Abstract<T> | object,
    object: string,
    options: JsonPropertyDeserializerOptions = {}
  ) {
    return TsinatraSerializer.deserialize(klass, JSON.parse(object), options);
  }
}
