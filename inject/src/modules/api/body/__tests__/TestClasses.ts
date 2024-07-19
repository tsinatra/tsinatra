import {tagged} from 'inversify';
import {BindingDecorator} from '../../../../annotation/BindingDecorator';
import {
  inject,
  injectable,
  named,
  optional,
} from '../../../../annotation/InjectorAnnotations';
import {
  jsonAttribute,
  jsonProperty,
} from '../../../../annotation/JsonPropertyAnnotation';
import {ApiBinding} from '../../../../bindings/ApiBinding';

@injectable()
export class TestClass {
  constructor(
    @jsonProperty(String)
    public readonly apiKey: string,

    @jsonProperty(Number, {propertyName: 'device_id'})
    public readonly deviceId: number,

    @jsonProperty(Boolean, {propertyName: 'is_working'})
    public readonly isWorking: boolean
  ) {}

  @jsonAttribute()
  public get name(): string {
    return 'Miguel';
  }
}

@injectable()
export class OptionalTestClass {
  constructor(
    @jsonProperty(String)
    public readonly apiKey: string,

    @jsonProperty(Number, {propertyName: 'device_id'})
    @optional()
    public readonly deviceId?: string,

    @jsonProperty(Boolean, {propertyName: 'is_working', isOptional: true})
    public readonly isWorking?: boolean
  ) {}
}

@injectable()
export class ArrayTestClass {
  constructor(
    @jsonProperty(String, {isArray: true})
    public readonly apiKeys: string[],

    @jsonProperty(Number, {isArray: true})
    public readonly deviceIds: number[],

    @jsonProperty(Boolean, {isArray: true})
    public readonly arrayOfBooleans: boolean[]
  ) {}
}

@injectable()
export class SubJsonPropertyTestClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(TestClass)
    public readonly testClass: TestClass
  ) {}
}

@injectable()
export class SubJsonArrayTestClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(TestClass, {isArray: true})
    public readonly testClasses: TestClass[]
  ) {}
}

@injectable()
export abstract class Vehicle {
  public abstract model: number;
  public abstract isWorking: boolean;
  constructor(
    @jsonProperty(String)
    public readonly make: string
  ) {}
}

@injectable()
export class Car extends Vehicle {
  constructor(
    @jsonProperty(String)
    public readonly make: string,

    @jsonProperty(Number)
    public readonly model: number,
    @jsonProperty(Boolean)
    public readonly isWorking: boolean
  ) {
    super(make);
  }
}

@injectable()
export class SubJsonPropertySubClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(Vehicle, {
      subTypes: {
        typeProperty: '__typename',
        typeMap: {
          Car: Car,
        },
      },
    })
    public readonly vehicle: Vehicle
  ) {}
}

@injectable()
export class SubJsonPropertyArraySubClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(Vehicle, {
      isArray: true,
      subTypes: {
        typeProperty: '__typename',
        typeMap: {
          Car: Car,
        },
      },
    })
    public readonly vehicles: Vehicle[]
  ) {}
}

export enum ChainNumber {
  Mainnet = 1,
  Polygon = 134,
}

export enum FeeType {
  Flat = 'flat',
  Regressive = 'regressive',
}

@injectable()
export class EnumPropertyClass {
  constructor(
    @jsonProperty(ChainNumber)
    public readonly chainId: ChainNumber,
    @jsonProperty(FeeType)
    public readonly feeType: FeeType
  ) {}
}

@injectable()
export class MissingNameTestClass {
  constructor(
    @inject(ApiBinding.JsonProperty)
    @tagged(BindingDecorator.typeTag, String)
    public readonly apiKey: string
  ) {}
}

@injectable()
export class MissingTypeTagTestClass {
  constructor(
    @inject(ApiBinding.JsonProperty)
    @named('apiKey')
    public readonly apiKey: string
  ) {}
}
