import {beforeEach, describe, expect, it, vi} from 'vitest';
import {UnserializableTypeError} from '../../errors/src/serializer/UnserializableTypeError';
import {BaseSerializer} from '../src/BaseSerializer';

class TestSerializer extends BaseSerializer {
  protected serializeObject(object: object): any {
    return object;
  }
}

describe('BaseSerializer', () => {
  let serializer: BaseSerializer;

  beforeEach(() => {
    serializer = new TestSerializer();
  });

  describe('#serialize', () => {
    it('serializes strings', () => {
      expect(serializer.serialize('Miguel')).toEqual('Miguel');
    });

    it('serializes array of strings', () => {
      expect(serializer.serialize(['Miguel', 'Tsiny', 'Tsinatra'])).toEqual([
        'Miguel',
        'Tsiny',
        'Tsinatra',
      ]);
    });

    it('serializes symbol', () => {
      expect(serializer.serialize(Symbol.for('label'))).toEqual('label');
    });

    it('serializes booleans', () => {
      expect(serializer.serialize(true)).toEqual(true);
      expect(serializer.serialize(false)).toEqual(false);
    });

    it('serializes numbers', () => {
      expect(serializer.serialize(1)).toEqual(1);
      expect(serializer.serialize(420.69)).toEqual(420.69);
      expect(serializer.serialize(123e5)).toEqual(12300000);
      expect(serializer.serialize(123e-5)).toEqual(0.00123);
    });

    it('serializes undefined', () => {
      expect(serializer.serialize(undefined)).toBeUndefined();
    });

    it('serializes bigint', () => {
      const bigint = 1234567890123456789012345n;
      expect(serializer.serialize(bigint)).toEqual('1234567890123456789012345');
    });

    it('serializes null', () => {
      expect(serializer.serialize(null)).toEqual(null);
    });

    it('serializes an object', () => {
      expect(
        serializer.serialize({name: 'Miguel', company: 'Tsinatra'})
      ).toEqual({name: 'Miguel', company: 'Tsinatra'});
    });

    it('serializes a Set', () => {
      expect(serializer.serialize(new Set([1, 2, 5, 42]))).toEqual([
        1, 2, 5, 42,
      ]);
    });

    it('serializes a Map', () => {
      expect(
        serializer.serialize(
          new Map([
            ['one', 1],
            ['two', 2],
            ['five', 5],
            ['the-answer', 42],
          ])
        )
      ).toEqual({
        one: 1,
        two: 2,
        five: 5,
        'the-answer': 42,
      });
    });

    it('serializes a RegExp', () => {
      expect(serializer.serialize(/{d}[a-z]+/)).toEqual('/{d}[a-z]+/');
    });

    it('serializes a Date', () => {
      vi.useFakeTimers();
      const dateObj = new Date(Date.now());
      expect(dateObj).not.toEqual(Date.now());
      expect(serializer.serialize(dateObj)).toEqual(Date.now());
      vi.useRealTimers();
    });

    describe('trying to serialize a function', () => {
      it('throws an error when trying to serialize a function', () => {
        expect(() => serializer.serialize(() => 'hello')).toThrowError(
          new UnserializableTypeError(() => 'hello')
        );
      });

      it('logs a critical error', () => {
        const helloFn = () => 'hello';
        try {
          serializer.serialize(helloFn);
          expect.unreachable('Serializer should have thrown an error');
        } catch (e) {
          expect(e).toStrictEqual(new UnserializableTypeError(helloFn));
        }
      });
    });
  });
});
