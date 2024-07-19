import {Logger} from '@aws-lambda-powertools/logger';
import {getClassNameOf} from '../../../../../../utils';
import {Container} from 'inversify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MissingJsonPropertyNameError} from '../../../../../../errors/src/serializer/MissingJsonPropertyNameError';
import {MissingJsonPropertyTypeError} from '../../../../../../errors/src/serializer/MissingJsonPropertyTypeError';
import {MissingRequiredJsonPropertyError} from '../../../../../../errors/src/serializer/MissingRequiredJsonPropertyError';
import {MissingSubTypeFromClassToDeserializeError} from '../../../../../../errors/src/serializer/MissingSubTypeFromClassToDeserializeError';
import {UnexpectedTypeError} from '../../../../../../errors/src/serializer/UnexpectedTypeError';
import {JsonBodyModule} from '../JsonBodyModule';
import {JsonPropertyModule} from '../JsonPropertyModule';
import {
  ArrayTestClass,
  ChainNumber,
  EnumPropertyClass,
  FeeType,
  MissingNameTestClass,
  MissingTypeTagTestClass,
  OptionalTestClass,
  SubJsonArrayTestClass,
  SubJsonPropertyArraySubClass,
  SubJsonPropertySubClass,
  SubJsonPropertyTestClass,
  TestClass,
  Vehicle,
} from './TestClasses';

const {mockedUseJsonBody} = vi.hoisted(() => {
  return {mockedUseJsonBody: vi.fn()};
});

vi.mock('sst/node/api', () => {
  return {useJsonBody: mockedUseJsonBody};
});

describe('JsonPropertyModule', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container({autoBindInjectable: true});
    container.bind(Container).toConstantValue(container);
    container.bind(Logger).toConstantValue({} as unknown as Logger);

    const jsonBodyModule = container.get(JsonBodyModule);
    jsonBodyModule.configure();
    const jsonPropertyModule = container.get(JsonPropertyModule);
    jsonPropertyModule.configure();
  });

  describe('TestClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"apiKey":"key-123","device_id":420,"is_working":true}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to each field', () => {
        const testClass = container.get(TestClass);
        expect(testClass.apiKey).toEqual('key-123');
        expect(testClass.deviceId).toEqual(420);
        expect(testClass.isWorking).toEqual(true);
        expect(testClass.name).toEqual('Miguel');
      });
    });

    describe('with incorrect body', () => {
      it('throws an UnexpectedTypeError when expected string is not a string', () => {
        const jsonObject = JSON.parse(
          '{"apiKey":123,"device_id":420,"is_working":true}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);

        expect(() => container.get(TestClass)).toThrowError(
          new UnexpectedTypeError(String, 123)
        );
      });

      it('throws an UnexpectedTypeError when expected number is not a number', () => {
        const jsonObject = JSON.parse(
          '{"apiKey":"key-123","device_id":"420","is_working":true}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);

        expect(() => container.get(TestClass)).toThrowError(
          new UnexpectedTypeError(Number, '420')
        );
      });

      it('throws an UnexpectedTypeError when expected boolean is not a boolean', () => {
        const jsonObject = JSON.parse(
          '{"apiKey":"key-123","device_id":420,"is_working":1}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);

        expect(() => container.get(TestClass)).toThrowError(
          new UnexpectedTypeError(Boolean, 1)
        );
      });
    });
  });

  describe('OptionalTestClass parsing', () => {
    describe('when optional fields are missing', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse('{"apiKey":"123"}');
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to each field and works with optional in options or annotation', () => {
        const testClass = container.get(OptionalTestClass);
        expect(testClass.apiKey).toEqual('123');
        expect(testClass.deviceId).toBeUndefined();
        expect(testClass.isWorking).toBeUndefined();
      });
    });

    describe('when optional fields are null', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"apiKey":"123","device_id":null,"is_working":null}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to each field and works with optional in options or annotation', () => {
        const testClass = container.get(OptionalTestClass);
        expect(testClass.apiKey).toEqual('123');
        expect(testClass.deviceId).toBeNull();
        expect(testClass.isWorking).toBeNull();
      });
    });

    describe('when optional fields are null or missing', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse('{"apiKey":"123","device_id":null}');
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to each field and works with optional in options or annotation', () => {
        const testClass = container.get(OptionalTestClass);
        expect(testClass.apiKey).toEqual('123');
        expect(testClass.deviceId).toBeNull();
        expect(testClass.isWorking).toBeUndefined();
      });
    });
  });

  describe('ArrayTestClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"apiKeys":["key-123","key-456"],"deviceIds":[69,420],"arrayOfBooleans":[true,false,true]}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to each field', () => {
        const testClass = container.get(ArrayTestClass);
        expect(testClass.apiKeys).toEqual(['key-123', 'key-456']);
        expect(testClass.deviceIds).toEqual([69, 420]);
        expect(testClass.arrayOfBooleans).toEqual([true, false, true]);
      });
    });

    describe('with incorrect body', () => {
      describe('string[]', () => {
        it('throws an UnexpectedTypeError when expected string[] is not a string[]', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":"123","deviceIds":[69,420],"arrayOfBooleans":[true,false,true]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(Array, '123')
          );
        });

        it('throws an UnexpectedTypeError when expected string[] contains invalid strings', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":["123",456],"deviceIds":[69,420],"arrayOfBooleans":[true,false,true]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(
              Array,
              ['123', 456],
              new UnexpectedTypeError(String, 456)
            )
          );
        });
      });

      describe('number[]', () => {
        it('throws an UnexpectedTypeError when expected number[] is not a number[]', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":["123","456"],"deviceIds":420,"arrayOfBooleans":[true,false,true]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(Array, 420)
          );
        });

        it('throws an UnexpectedTypeError when expected string[] contains invalid strings', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":["123","456"],"deviceIds":[69,"420"],"arrayOfBooleans":[true,false,true]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(
              Array,
              [69, '420'],
              new UnexpectedTypeError(Number, '420')
            )
          );
        });
      });

      describe('boolean[]', () => {
        it('throws an UnexpectedTypeError when expected boolean[] is not a boolean[]', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":["123","456"],"deviceIds":[69,420],"arrayOfBooleans":true}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(Array, true)
          );
        });

        it('throws an UnexpectedTypeError when expected boolean[] contains invalid boolean', () => {
          const jsonObject = JSON.parse(
            '{"apiKeys":["123","456"],"deviceIds":[69,420],"arrayOfBooleans":[true,"false",true]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);

          expect(() => container.get(ArrayTestClass)).toThrowError(
            new UnexpectedTypeError(
              Array,
              [true, 'false', true],
              new UnexpectedTypeError(Boolean, 'false')
            )
          );
        });
      });
    });
  });

  describe('SubJsonPropertyTestClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","testClass":{"apiKey":"key-123","device_id":456,"is_working":true}}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        const subTestClass = container.get(SubJsonPropertyTestClass);
        expect(subTestClass.name).toEqual('Tsiny');
        expect(subTestClass.testClass).toBeDefined();
        expect(subTestClass.testClass.apiKey).toEqual('key-123');
        expect(subTestClass.testClass.deviceId).toEqual(456);
        expect(subTestClass.testClass.isWorking).toEqual(true);
      });
    });

    describe('with missing sub-property', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse('{"name":"Tsiny"}');
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('throws the correct error', () => {
        expect(() => container.get(SubJsonPropertyTestClass)).toThrowError(
          new MissingRequiredJsonPropertyError(
            'testClass',
            TestClass,
            undefined,
            {}
          )
        );
      });
    });

    describe('with undefined body', () => {
      beforeEach(() => {
        const jsonObject = undefined;
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('throws the correct error', () => {
        expect(() => container.get(SubJsonPropertyTestClass)).toThrowError(
          new MissingRequiredJsonPropertyError('name', String, undefined)
        );
      });
    });
  });

  describe('SubJsonArrayTestClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","testClasses":[{"apiKey":"key-123","device_id":420,"is_working":true}, {"apiKey":"key-456","device_id":69,"is_working":false}]}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        const subTestClass = container.get(SubJsonArrayTestClass);
        expect(subTestClass.name).toEqual('Tsiny');
        expect(subTestClass.testClasses).toBeDefined();
        expect(subTestClass.testClasses).toHaveLength(2);
        expect(subTestClass.testClasses[0].apiKey).toEqual('key-123');
        expect(subTestClass.testClasses[0].deviceId).toEqual(420);
        expect(subTestClass.testClasses[0].isWorking).toEqual(true);
        expect(subTestClass.testClasses[1].apiKey).toEqual('key-456');
        expect(subTestClass.testClasses[1].deviceId).toEqual(69);
        expect(subTestClass.testClasses[1].isWorking).toEqual(false);
      });
    });

    describe('with incorrect body', () => {
      describe('missing required array of sub json property', () => {
        beforeEach(() => {
          const jsonObject = JSON.parse('{"name":"Tsiny"}');
          mockedUseJsonBody.mockReturnValue(jsonObject);
        });

        it('throws an UnexpectedTypeError', () => {
          expect(() => container.get(SubJsonArrayTestClass)).toThrowError(
            new UnexpectedTypeError(Array, undefined)
          );
        });
      });

      describe('json property is not an array', () => {
        beforeEach(() => {
          const jsonObject = JSON.parse('{"name":"Tsiny","testClasses":123}');
          mockedUseJsonBody.mockReturnValue(jsonObject);
        });

        it('throws an UnexpectedTypeError', () => {
          expect(() => container.get(SubJsonArrayTestClass)).toThrowError(
            new UnexpectedTypeError(Array, 123)
          );
        });
      });

      describe('json property is an array with incorrect type', () => {
        beforeEach(() => {
          const jsonObject = JSON.parse(
            '{"name":"Tsiny","testClasses":[{"apiKey":"key-123","device_id":420,"is_working":true},456]}'
          );
          mockedUseJsonBody.mockReturnValue(jsonObject);
        });

        it('throws an UnexpectedTypeError', () => {
          expect(() => container.get(SubJsonArrayTestClass)).toThrowError(
            new UnexpectedTypeError(
              Array,
              [{apiKey: 'key-123', device_id: 420, is_working: true}, 456],
              new MissingRequiredJsonPropertyError(
                'apiKey',
                TestClass,
                undefined
              )
            )
          );
        });
      });
    });
  });

  describe('SubJsonPropertySubClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","vehicle":{"__typename":"Car","make":"Chevy","model":456,"isWorking":true}}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        const subTestClass = container.get(SubJsonPropertySubClass);
        expect(subTestClass.name).toEqual('Tsiny');
        expect(subTestClass.vehicle).toBeDefined();
        expect(getClassNameOf(subTestClass.vehicle)).toEqual('Car');
        expect(subTestClass.vehicle.make).toEqual('Chevy');
        expect(subTestClass.vehicle.model).toEqual(456);
        expect(subTestClass.vehicle.isWorking).toEqual(true);
      });
    });

    describe('with missing subtype from typeMaps', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","vehicle":{"__typename":"Truck","make":"Chevy","model":456,"isWorking":true}}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('throws an MissingSubTypeFromClassToDeserializeError', () => {
        expect(() => container.get(SubJsonPropertySubClass)).toThrowError(
          new MissingSubTypeFromClassToDeserializeError(Vehicle, 'Truck')
        );
      });
    });

    describe('with missing typeProperty field', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","vehicle":{"make":"Chevy","model":456,"isWorking":true}}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('throws an MissingRequiredJsonPropertyError', () => {
        expect(() => container.get(SubJsonPropertySubClass)).toThrowError(
          new MissingRequiredJsonPropertyError('__typename', String, {
            make: 'Chevy',
            model: 456,
            isWorking: true,
          })
        );
      });
    });
  });

  describe('SubJsonPropertyArraySubClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse(
          '{"name":"Tsiny","vehicles":[{"__typename":"Car","make":"Chevy","model":456,"isWorking":true}]}'
        );
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        const subTestClass = container.get(SubJsonPropertyArraySubClass);
        expect(subTestClass.name).toEqual('Tsiny');
        expect(subTestClass.vehicles).toBeDefined();
        expect(getClassNameOf(subTestClass.vehicles[0])).toEqual('Car');
        expect(subTestClass.vehicles[0].make).toEqual('Chevy');
        expect(subTestClass.vehicles[0].model).toEqual(456);
        expect(subTestClass.vehicles[0].isWorking).toEqual(true);
      });
    });
  });

  describe('EnumPropertyClass parsing', () => {
    describe('with correct body', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse('{"chainId":1,"feeType":"flat"}');
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        const testClass = container.get(EnumPropertyClass);
        expect(testClass.chainId).toBe(ChainNumber.Mainnet);
        expect(testClass.feeType).toBe(FeeType.Flat);
      });
    });

    describe('with incorrect values', () => {
      beforeEach(() => {
        const jsonObject = JSON.parse('{"chainId":2,"feeType":"flatten"}');
        mockedUseJsonBody.mockReturnValue(jsonObject);
      });

      it('assigns correct values to the field', () => {
        expect(() => container.get(EnumPropertyClass)).toThrowError(
          new UnexpectedTypeError(ChainNumber, 2)
        );
      });
    });
  });

  describe('MissingNameTestClass parsing', () => {
    beforeEach(() => {
      const jsonObject = JSON.parse('{"device_id":"device-456"}');
      mockedUseJsonBody.mockReturnValue(jsonObject);
    });

    it('Throws an error when a required field is missing', () => {
      expect(() => container.get(MissingNameTestClass)).toThrowError(
        new MissingJsonPropertyNameError()
      );
    });
  });

  describe('MissingTypeTagTestClass parsing', () => {
    beforeEach(() => {
      const jsonObject = JSON.parse('{"device_id":"device-456"}');
      mockedUseJsonBody.mockReturnValue(jsonObject);
    });

    it('Throws an error when a required field is missing', () => {
      expect(() => container.get(MissingTypeTagTestClass)).toThrowError(
        new MissingJsonPropertyTypeError()
      );
    });
  });
});
