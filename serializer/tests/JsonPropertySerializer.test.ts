import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingJsonPropertyAnnotationsError} from '../../errors/src/serializer/MissingJsonPropertyAnnotationsError';
import {JsonPropertySerializer} from '../src/JsonPropertySerializer';
import {
  TestAttributeSerializable,
  TestBadSerializable,
  TestClassOnly,
  TestDateSerializable,
  TestEmptySerializable,
  TestIgnoreWrapperSerializable,
  TestSerializable,
  TestSerializeFn,
  TestSerializeFnWithSerializable,
  TestSerializeJsonProp,
  TestStringifiedSerializable,
  TestWrapperSerializable,
} from './TestClasses';

describe('JsonPropertySerializer', () => {
  describe('with an object which class has a `@serializable` decorator', () => {
    it('serializes the object using `jsonProperty` decorators', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual({
        name: 'Miguel',
        organization: 'Tsinatra',
      });
    });

    it('ignores the `serialize` function', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      expect(
        JsonPropertySerializer.instance.serialize(serializable)
      ).not.toEqual({
        firstName: 'Miguel',
        company: 'Tsinatra',
      });
    });

    describe('when there are no `jsonProperty` decorators', () => {
      it('throws an error when there are no `jsonProperty` decorators', () => {
        const serializable = new TestBadSerializable('Miguel');
        expect(() =>
          JsonPropertySerializer.instance.serialize(serializable)
        ).toThrowError(
          new MissingJsonPropertyAnnotationsError('TestBadSerializable')
        );
      });

      it('uses the `serialize` function when there is one', () => {
        const serializable = new TestSerializeFnWithSerializable('Miguel');
        expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual(
          {
            myName: 'Miguel',
          }
        );
      });
    });
  });

  describe('TestJsonAttributeSerialize', () => {
    it('serializes the object using `jsonProperty` and `jsonAttribute` decorators', () => {
      const serializable = new TestAttributeSerializable('Miguel', 'Tsinatra');
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual({
        firstName: 'Miguel',
        lastName: 'Cervera',
        organization: 'Tsinatra',
        city: 'NewYork',
        email: 'miguel@tsinatra.com',
        underlying: {
          name: 'Miguel',
          organization: 'Tsinatra',
        },
      });
    });
  });

  describe('with an object that has a serialize function and no `serializable` decorator', () => {
    it('returns a serialized response', () => {
      const serializableWithFn = new TestSerializeFn('Routing', 33);
      expect(
        JsonPropertySerializer.instance.serialize(serializableWithFn)
      ).toEqual({
        teamName: 'Routing',
        age: 33,
      });
    });

    it('prefers serialize method over jsonProperty decorators', () => {
      const serializableWithFn = new TestSerializeFn('Routing', 33);
      expect(
        JsonPropertySerializer.instance.serialize(serializableWithFn)
      ).not.toHaveProperty('group');
    });
  });

  describe('with an object that has `jsonProperty` decorators and no `serializable` decorator', () => {
    it('returns a serialized response', () => {
      const serializable = new TestSerializeJsonProp('Tsiny', 'Tsinatra');
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual({
        name: 'Tsiny',
        team: 'Tsinatra',
      });
    });
  });

  describe('with a regular object with no decorators nor serialize function', () => {
    it('returns the same object', () => {
      const serializable = new TestClassOnly('New York');
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual({
        city: 'New York',
      });
    });
  });

  describe('with allowEmpty option enabled', () => {
    it('returns an empty object', () => {
      const serializable = new TestEmptySerializable();
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual(
        {}
      );
    });
  });

  describe('TestDateSerializable', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a shallow object', () => {
      const serializable = new TestDateSerializable(new Date(Date.now()));
      expect(JsonPropertySerializer.instance.serialize(serializable)).toEqual({
        date: Date.now(),
      });
    });
  });

  describe('TestStringifiedSerializable', () => {
    it('returns a shallow object', () => {
      const serializable = new TestSerializable('Miguel', 'Tsinatra');
      const stringifiedSerializable = new TestStringifiedSerializable(
        serializable
      );
      expect(
        JsonPropertySerializer.instance.serialize(stringifiedSerializable)
      ).toEqual({
        serializable: JSON.stringify(
          JsonPropertySerializer.instance.serialize(serializable)
        ),
      });
    });
  });

  describe('TestWrapperSerializable', () => {
    it('Can serialize and deserialize correctly', () => {
      const serializable = new TestWrapperSerializable('Miguel');
      expect(
        JsonPropertySerializer.instance.serialize(serializable)
      ).toStrictEqual('Miguel');
    });
  });

  describe('TestIgnoreWrapperSerializable', () => {
    it('Can serialize and deserialize correctly', () => {
      const wrapper = new TestWrapperSerializable('Miguel');
      const serializable = new TestIgnoreWrapperSerializable(wrapper, wrapper);
      expect(
        JsonPropertySerializer.instance.serialize(serializable)
      ).toStrictEqual({
        ignoredWrap: {
          name: 'Miguel',
        },
        wrapped: 'Miguel',
      });
    });
  });
});
