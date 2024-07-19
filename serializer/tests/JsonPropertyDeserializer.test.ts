import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {JsonPropertyDeserializer} from '../src/JsonPropertyDeserializer';
import {JsonPropertySerializer} from '../src/JsonPropertySerializer';
import {
  Car,
  SubJsonPropertyArraySubClass,
  SubJsonPropertyStringifiedSubClass,
  SubJsonPropertySubClass,
  TestAttributeSerializable,
  TestDateSerializable,
  TestEmptySerializable,
  TestIgnoreWrapperSerializable,
  TestSerializable,
  TestStringifiedSerializable,
  TestWrapperSerializable,
} from './TestClasses';

describe('JsonPropertyJsonPropertyDeserializer', () => {
  describe('with an object which class has a `@serializable` decorator', () => {
    it('serializes the object using `jsonProperty` decorators', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestSerializable,
          JsonPropertySerializer.instance.serialize(serializable)
        )
      ).toStrictEqual(serializable);
    });

    it('ignores the `serialize` function', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestSerializable,
          JsonPropertySerializer.instance.serialize(serializable)
        )
      ).toStrictEqual(serializable);
    });
  });

  describe('TestAttributeSerializable', () => {
    it('deserializes correctly, ignoring jsonAttribute fields', () => {
      const serializable = new TestAttributeSerializable('Miguel', 'Tsinatra');
      const serialized = JsonPropertySerializer.instance.serialize(
        serializable
      ) as any;
      serialized.lastName = 'Contreras';

      expect(serialized.lastName).toEqual('Contreras');

      const deserialized = JsonPropertyDeserializer.instance.deserialize(
        TestAttributeSerializable,
        serialized
      ) as TestAttributeSerializable;

      expect(deserialized).toStrictEqual(serializable);
      expect(deserialized.lastName).toEqual('Cervera');
      expect(deserialized.city).toEqual('NewYork');
      expect(deserialized.email).toEqual('miguel@tsinatra.com');
    });
  });

  describe('with allowEmpty option enabled', () => {
    it('returns an empty object', () => {
      const serializable = new TestEmptySerializable();
      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestEmptySerializable,
          JsonPropertySerializer.instance.serialize(serializable)
        )
      ).toStrictEqual(serializable);
    });
  });

  describe('TestWrapperSerializable', () => {
    it('Can serialize and deserialize correctly', () => {
      const serializable = new TestWrapperSerializable('Miguel');
      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestWrapperSerializable,
          JsonPropertySerializer.instance.serialize(serializable)
        )
      ).toStrictEqual(serializable);
    });
  });

  describe('TestIgnoreWrapperSerializable', () => {
    it('Can serialize and deserialize correctly', () => {
      const wrapper = new TestWrapperSerializable('Miguel');
      const serializable = new TestIgnoreWrapperSerializable(wrapper, wrapper);

      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestIgnoreWrapperSerializable,
          JsonPropertySerializer.instance.serialize(serializable)
        )
      ).toStrictEqual(serializable);
    });
  });

  describe('TestStringifiedSerializable', () => {
    it('returns a shallow object', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      const stringifiedSerializable = new TestStringifiedSerializable(
        serializable
      );
      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestStringifiedSerializable,
          JsonPropertySerializer.instance.serialize(stringifiedSerializable)
        )
      ).toStrictEqual(stringifiedSerializable);
    });
  });

  describe('SubJsonPropertySubClass', () => {
    it('returns a the correct subtype', () => {
      const car = new Car('Ford', 123, true);
      const serializable = new SubJsonPropertySubClass('Miguel', car);
      const serialized =
        JsonPropertySerializer.instance.serialize(serializable);
      const deserialized = JsonPropertyDeserializer.instance.deserialize(
        SubJsonPropertySubClass,
        serialized
      );

      expect(deserialized).toStrictEqual(serializable);
    });
  });

  describe('SubJsonPropertyStringifiedSubClass', () => {
    it('returns a the correct subtype', () => {
      const car = new Car('Ford', 123, true);
      const serializable = new SubJsonPropertyStringifiedSubClass(
        'Miguel',
        car
      );
      const serialized =
        JsonPropertySerializer.instance.serialize(serializable);
      const deserialized = JsonPropertyDeserializer.instance.deserialize(
        SubJsonPropertyStringifiedSubClass,
        serialized
      );

      expect(deserialized).toStrictEqual(serializable);
    });
  });

  describe('SubJsonPropertyArraySubClass', () => {
    it('returns a the correct subtype', () => {
      const cars = [new Car('Ford', 123, true), new Car('Honda', 456, false)];
      const serializable = new SubJsonPropertyArraySubClass('Miguel', cars);
      const serialized =
        JsonPropertySerializer.instance.serialize(serializable);
      const deserialized = JsonPropertyDeserializer.instance.deserialize(
        SubJsonPropertyArraySubClass,
        serialized
      );

      expect(deserialized).toStrictEqual(serializable);
    });
  });

  describe('TestDateSerializable', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('correctly deserializes Date type', () => {
      const serializable = new TestDateSerializable(new Date(Date.now()));
      const serialized =
        JsonPropertySerializer.instance.serialize(serializable);

      expect(
        JsonPropertyDeserializer.instance.deserialize(
          TestDateSerializable,
          serialized
        )
      ).toEqual(serializable);
    });
  });
});
