import {beforeEach, describe, expect, it, vi} from 'vitest';
import {UnexpectedTypeError} from '../../errors/src/serializer/UnexpectedTypeError';
import {ValidationError} from '../../errors/src/validation/ValidationError';
import {BaseDeserializer, Deserialized} from '../src/BaseDeserializer';

class TestDeserializer extends BaseDeserializer {
  protected deserializeObject<T>(): Deserialized<T> {
    throw new Error();
  }
}

describe('BaseDeserializer', () => {
  let deserializer: BaseDeserializer;

  beforeEach(() => {
    deserializer = new TestDeserializer();
  });

  describe('#deserialize', () => {
    it('deserializes undefined', () => {
      expect(deserializer.deserialize(Object, undefined)).toBeUndefined();
    });

    it('deserializes null', () => {
      expect(deserializer.deserialize(Number, null)).toEqual(null);
    });

    describe('String', () => {
      it('deserializes strings', () => {
        expect(deserializer.deserialize(String, 'Miguel')).toEqual('Miguel');
      });

      it('throws an error when object is not string, and it is strict mode', () => {
        // throws error
        expect(() => deserializer.deserialize(String, {})).toThrowError(
          new UnexpectedTypeError(String, {})
        );
      });

      it('deserializes object as string when strict mode is disabled', () => {
        // throws error
        expect(deserializer.deserialize(String, {}, {strict: false})).toEqual(
          '[object Object]'
        );
      });
    });

    describe('Boolean', () => {
      it('deserializes booleans', () => {
        expect(deserializer.deserialize(Boolean, true)).toEqual(true);
        expect(deserializer.deserialize(Boolean, false)).toEqual(false);
      });

      it('deserializes non-strict booleans', () => {
        expect(
          deserializer.deserialize(Boolean, 'true', {strict: false})
        ).toEqual(true);
        expect(
          deserializer.deserialize(Boolean, 'TRUE', {strict: false})
        ).toEqual(true);
        expect(
          deserializer.deserialize(Boolean, 'tRuE', {strict: false})
        ).toEqual(true);
        expect(deserializer.deserialize(Boolean, 't', {strict: false})).toEqual(
          true
        );
        expect(deserializer.deserialize(Boolean, 'T', {strict: false})).toEqual(
          true
        );
      });

      it('throws an error attempting to deserialize other types as boolean when strict mode is enabled', () => {
        expect(() => deserializer.deserialize(Boolean, 1)).toThrowError(
          new UnexpectedTypeError(Boolean, 1)
        );
        expect(() => deserializer.deserialize(Boolean, 0)).toThrowError(
          new UnexpectedTypeError(Boolean, 0)
        );
      });

      it('deserializes booleans from other types when strict mode is disabled', () => {
        expect(deserializer.deserialize(Boolean, 1, {strict: false})).toEqual(
          true
        );
        expect(deserializer.deserialize(Boolean, 0, {strict: false})).toEqual(
          false
        );
      });
    });

    describe('Number', () => {
      it('deserializes numbers', () => {
        expect(deserializer.deserialize(Number, 1)).toEqual(1);
        expect(deserializer.deserialize(Number, 420.69)).toEqual(420.69);
        expect(deserializer.deserialize(Number, 123e5)).toEqual(12300000);
        expect(deserializer.deserialize(Number, 123e-5)).toEqual(0.00123);
      });

      it('deserializes numbers from string when not in strict mode', () => {
        expect(deserializer.deserialize(Number, '1', {strict: false})).toEqual(
          1
        );
        expect(
          deserializer.deserialize(Number, '420.69', {strict: false})
        ).toEqual(420.69);
        expect(
          deserializer.deserialize(Number, '123e5', {strict: false})
        ).toEqual(12300000);
        expect(
          deserializer.deserialize(Number, '123e-5', {strict: false})
        ).toEqual(0.00123);
      });

      it('throws error when trying to deserialize number from string in strict mode', () => {
        expect(() => deserializer.deserialize(Number, '1')).toThrowError(
          new UnexpectedTypeError(Number, '1')
        );
      });

      it('throws error when number is NaN', () => {
        expect(() => deserializer.deserialize(Number, 'hola')).toThrowError(
          new UnexpectedTypeError(Number, 'hola')
        );
      });

      it('returns NaN when NaN and not in strict mode', () => {
        expect(
          deserializer.deserialize(Number, 'hola', {strict: false})
        ).toEqual(NaN);
      });
    });

    describe('BigInt', () => {
      it('deserializes bigint from string', () => {
        const bigintStr = '1234567890123456789012345';
        const bigint = BigInt(1234567890123456789012345n);
        expect(deserializer.deserialize(BigInt, bigintStr)).toEqual(bigint);
      });

      it('deserializes bigint from number', () => {
        const bigintSer = 123456;
        const bigint = BigInt(123456);
        expect(deserializer.deserialize(BigInt, bigintSer)).toEqual(bigint);
      });

      it('deserializes bigint from boolean', () => {
        const bigintSer = true;
        const bigint = BigInt(1);
        expect(deserializer.deserialize(BigInt, bigintSer)).toEqual(bigint);
      });

      it('throws error when deserializing invalid string', () => {
        const bigintStr = 'hola';
        expect(() => deserializer.deserialize(BigInt, bigintStr)).toThrowError(
          new UnexpectedTypeError(BigInt, 'hola')
        );
      });

      it('throws error when deserializing number with decimals', () => {
        const bigintSer = 123456.789;
        expect(() => deserializer.deserialize(BigInt, bigintSer)).toThrowError(
          new UnexpectedTypeError(BigInt, 123456.789)
        );
      });
    });

    it('deserializes an object', () => {
      expect(
        deserializer.deserialize(Object, {name: 'Miguel', company: 'Tsinatra'})
      ).toEqual({name: 'Miguel', company: 'Tsinatra'});
    });

    it('deserializes a symbol', () => {
      const symbol = Symbol.for('label');
      expect(deserializer.deserialize(Symbol, 'label')).toEqual(symbol);
    });

    it('deserializes an Array', () => {
      expect(
        deserializer.deserialize(Array, ['Miguel', 'Tsiny', 'Tsinatra', 1, 5])
      ).toEqual(['Miguel', 'Tsiny', 'Tsinatra', 1, 5]);
    });

    it('deserializes a Set', () => {
      expect(deserializer.deserialize(Set, [1, 2, 5, 42])).toEqual(
        new Set([1, 2, 5, 42])
      );
    });

    it('deserializes a Map', () => {
      expect(
        deserializer.deserialize(Map, {
          one: 1,
          two: 2,
          five: 5,
          'the-answer': 42,
        })
      ).toEqual(
        new Map([
          ['one', 1],
          ['two', 2],
          ['five', 5],
          ['the-answer', 42],
        ])
      );
    });

    it('deserializes a RegExp', () => {
      expect(deserializer.deserialize(RegExp, '/{d}[a-z]+/')).toEqual(
        /{d}[a-z]+/
      );
    });

    it('deserializes a Date', () => {
      vi.useFakeTimers();
      const dateObj = new Date(Date.now());
      expect(dateObj).not.toEqual(Date.now());
      expect(deserializer.deserialize(Date, Date.now())).toEqual(dateObj);
      vi.useRealTimers();
    });
  });

  describe('#deserializeArray', () => {
    it('deserializes array of strings', () => {
      expect(
        deserializer.deserializeArray(String, ['Miguel', 'Tsiny', 'Tsinatra'])
      ).toEqual(['Miguel', 'Tsiny', 'Tsinatra']);
    });
  });

  describe('#deserializeSet', () => {
    it('deserializes a Set of symbols', () => {
      expect(
        deserializer.deserializeSet(Symbol, ['Miguel', 'Tsiny', 'Tsinatra'])
      ).toEqual(
        new Set([
          Symbol.for('Miguel'),
          Symbol.for('Tsiny'),
          Symbol.for('Tsinatra'),
        ])
      );
    });
  });

  describe('#deserializeMap', () => {
    it('deserializes map of BigInt', () => {
      expect(
        deserializer.deserializeMap(BigInt, [
          ['Miguel', '1000'],
          ['Tsiny', '123456789123456789'],
          ['Tsinatra', '123456789123456789123456789'],
        ])
      ).toEqual(
        new Map([
          ['Miguel', 1000n],
          ['Tsiny', 123456789123456789n],
          ['Tsinatra', 123456789123456789123456789n],
        ])
      );
    });
  });
});
