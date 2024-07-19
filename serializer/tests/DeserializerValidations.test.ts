import {beforeEach, describe, expect, it} from 'vitest';
import {ValidationError} from '../../errors/src/validation/ValidationError';
import {BaseDeserializer, Deserialized} from '../src/BaseDeserializer';

class TestDeserializer extends BaseDeserializer {
  protected deserializeObject<T>(): Deserialized<T> {
    throw new Error();
  }
}

describe('DeserializerValidations', () => {
  let deserializer: BaseDeserializer;

  beforeEach(() => {
    deserializer = new TestDeserializer();
  });

  describe('validations', () => {
    describe('.less_than', () => {
      describe('for Number', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Number, 3, {validations: {less_than: 4}})
          ).toEqual(3);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Number, 5, {validations: {less_than: 3}})
          ).toThrowError(
            new ValidationError("Expected '5' to be less than '3'")
          );
        });
      });

      describe('for BigInt', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(BigInt, 3n, {validations: {less_than: 4n}})
          ).toEqual(3n);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(BigInt, 3n, {validations: {less_than: 3n}})
          ).toThrowError(
            new ValidationError("Expected '3' to be less than '3'")
          );
        });
      });
    });

    describe('.less_or_equal_than', () => {
      describe('for Number', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Number, 3, {
              validations: {less_or_equal_than: 3},
            })
          ).toEqual(3);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Number, 5, {
              validations: {less_or_equal_than: 3},
            })
          ).toThrowError(
            new ValidationError("Expected '5' to be less or equal than '3'")
          );
        });
      });

      describe('for BigInt', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(BigInt, 3n, {
              validations: {less_or_equal_than: 4n},
            })
          ).toEqual(3n);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(BigInt, 4n, {
              validations: {less_or_equal_than: 3n},
            })
          ).toThrowError(
            new ValidationError("Expected '4' to be less or equal than '3'")
          );
        });
      });
    });

    describe('.greater_than', () => {
      describe('for Number', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Number, 5, {
              validations: {greater_than: 4},
            })
          ).toEqual(5);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Number, 2, {
              validations: {greater_than: 3},
            })
          ).toThrowError(
            new ValidationError("Expected '2' to be greater than '3'")
          );
        });
      });

      describe('for BigInt', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(BigInt, 5n, {
              validations: {greater_than: 4n},
            })
          ).toEqual(5n);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(BigInt, 3n, {
              validations: {greater_than: 3n},
            })
          ).toThrowError(
            new ValidationError("Expected '3' to be greater than '3'")
          );
        });
      });
    });

    describe('.greater_or_equal_than', () => {
      describe('for Number', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Number, 5, {
              validations: {greater_or_equal_than: 4},
            })
          ).toEqual(5);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Number, 2, {
              validations: {greater_or_equal_than: 3},
            })
          ).toThrowError(
            new ValidationError("Expected '2' to be greater or equal than '3'")
          );
        });
      });

      describe('for BigInt', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(BigInt, 3n, {
              validations: {greater_or_equal_than: 3n},
            })
          ).toEqual(3n);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(BigInt, 1n, {
              validations: {greater_or_equal_than: 3n},
            })
          ).toThrowError(
            new ValidationError("Expected '1' to be greater or equal than '3'")
          );
        });
      });
    });

    describe('.length', () => {
      describe('for String', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(String, 'Hello', {
              validations: {length: 5},
            })
          ).toEqual('Hello');
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(String, 'Hello', {
              validations: {length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'Hello' to be have length '3', but it has length '5'"
            )
          );
        });
      });

      describe('for Array', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have length '3', but it has length '5'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have length '3', but it has length '5'"
            )
          );
        });
      });

      describe('for Set', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have length '3', but it has length '4'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have length '3', but it has length '4'"
            )
          );
        });
      });

      describe('for Map', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {length: 3},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have length '3', but it has length '2'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {length: 1},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have length '1', but it has length '2'"
            )
          );
        });
      });
    });

    describe('.max_length', () => {
      describe('for String', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(String, 'Hello', {
              validations: {max_length: 5},
            })
          ).toEqual('Hello');

          expect(
            deserializer.deserialize(String, 'Hello', {
              validations: {max_length: 10},
            })
          ).toEqual('Hello');
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(String, 'Hello', {
              validations: {max_length: 4},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'Hello' to be have maximum length '4', but it has length '5'"
            )
          );
        });
      });

      describe('for Array', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {max_length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {max_length: 10},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {max_length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {max_length: 10},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {max_length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have maximum length '3', but it has length '5'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {max_length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have maximum length '3', but it has length '5'"
            )
          );
        });
      });

      describe('for Set', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {max_length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {max_length: 10},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {max_length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {max_length: 10},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {max_length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have maximum length '3', but it has length '4'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {max_length: 3},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have maximum length '3', but it has length '4'"
            )
          );
        });
      });

      describe('for Map', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {max_length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {max_length: 5},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {max_length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {max_length: 5},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {max_length: 1},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have maximum length '1', but it has length '2'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {max_length: 1},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have maximum length '1', but it has length '2'"
            )
          );
        });
      });
    });

    describe('.min_length', () => {
      describe('for String', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(String, 'Hello', {
              validations: {min_length: 5},
            })
          ).toEqual('Hello');

          expect(
            deserializer.deserialize(String, 'Hello', {
              validations: {min_length: 1},
            })
          ).toEqual('Hello');
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(String, 'Hello', {
              validations: {min_length: 6},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'Hello' to be have minimum length '6', but it has length '5'"
            )
          );
        });
      });

      describe('for Array', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {min_length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {min_length: 2},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {min_length: 5},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {min_length: 2},
            })
          ).toEqual(['H', 'e', 'l', 'l', 'o']);
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Array, 'Hello'.split(''), {
              validations: {min_length: 6},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have minimum length '6', but it has length '5'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isArray: true,
              validations: {min_length: 7},
            })
          ).toThrowError(
            new ValidationError(
              "Expected 'H,e,l,l,o' to be have minimum length '7', but it has length '5'"
            )
          );
        });
      });

      describe('for Set', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {min_length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {min_length: 2},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {min_length: 4},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));

          expect(
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {min_length: 2},
            })
          ).toEqual(new Set(['H', 'e', 'l', 'o']));
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(Set, 'Hello'.split(''), {
              validations: {min_length: 5},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have minimum length '5', but it has length '4'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(String, 'Hello'.split(''), {
              isSet: true,
              validations: {min_length: 6},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '[object Set]' to be have minimum length '6', but it has length '4'"
            )
          );
        });
      });

      describe('for Map', () => {
        it('passes validation', () => {
          expect(
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {min_length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {min_length: 1},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {min_length: 2},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );

          expect(
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {min_length: 1},
              }
            )
          ).toEqual(
            new Map([
              ['a', 1],
              ['b', 2],
            ])
          );
        });

        it('fails validation', () => {
          expect(() =>
            deserializer.deserialize(
              Map,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                validations: {min_length: 3},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have minimum length '3', but it has length '2'"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(
              Number,
              [
                ['a', 1],
                ['b', 2],
              ],
              {
                isMap: true,
                validations: {min_length: 4},
              }
            )
          ).toThrowError(
            new ValidationError(
              "Expected '[object Map]' to be have minimum length '4', but it has length '2'"
            )
          );
        });
      });
    });

    describe('.pattern', () => {
      it('passes validation', () => {
        expect(
          deserializer.deserialize(String, '27983', {
            validations: {pattern: /\d+/},
          })
        ).toEqual('27983');

        expect(
          deserializer.deserialize(String, '0x27983', {
            validations: {pattern: /0x\d+/},
          })
        ).toEqual('0x27983');
      });

      it('fails validation', () => {
        expect(() =>
          deserializer.deserialize(String, '27983', {
            validations: {pattern: /[a-z]+/},
          })
        ).toThrowError(
          new ValidationError("Expected '27983' to match pattern '/[a-z]+/'")
        );

        expect(() =>
          deserializer.deserialize(String, '0x27983', {
            validations: {pattern: /0x[a-z]+/},
          })
        ).toThrowError(
          new ValidationError(
            "Expected '0x27983' to match pattern '/0x[a-z]+/'"
          )
        );
      });
    });

    describe('.custom_validation', () => {
      describe('custom only odd number validations', () => {
        let OnlyEven: (obj: any) => boolean;

        beforeEach(() => {
          OnlyEven = (obj: number) => obj % 2 === 0;
        });

        it('passes validations', () => {
          expect(
            deserializer.deserialize(Number, 10, {
              validations: {custom_validation: OnlyEven},
            })
          ).toEqual(10);
        });

        it('fails validations', () => {
          expect(() =>
            deserializer.deserialize(Number, 11, {
              validations: {custom_validation: OnlyEven},
            })
          ).toThrowError(
            new ValidationError("Expected '11' to satisfy custom validation")
          );
        });
      });
    });

    describe('.custom_collection_validation', () => {
      describe('custom only odd number validations', () => {
        let sumIsEven: (obj: any) => boolean;

        beforeEach(() => {
          sumIsEven = (obj: number[]) => {
            const sum = obj.reduce((a, b) => a + b, 0);
            return sum % 2 === 0;
          };
        });

        it('passes validations', () => {
          expect(
            deserializer.deserialize(Array, [20, 10, 30], {
              validations: {custom_collection_validation: sumIsEven},
            })
          ).toEqual([20, 10, 30]);

          expect(
            deserializer.deserializeAnyType(Number, [20, 10, 30], {
              isArray: true,
              validations: {custom_collection_validation: sumIsEven},
            })
          ).toEqual([20, 10, 30]);
        });

        it('fails validations', () => {
          expect(() =>
            deserializer.deserialize(Array, [20, 10, 31], {
              validations: {custom_collection_validation: sumIsEven},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '20,10,31' to satisfy custom collection validation"
            )
          );

          expect(() =>
            deserializer.deserializeAnyType(Number, [20, 10, 31], {
              isArray: true,
              validations: {custom_collection_validation: sumIsEven},
            })
          ).toThrowError(
            new ValidationError(
              "Expected '20,10,31' to satisfy custom collection validation"
            )
          );
        });
      });
    });
  });
});
