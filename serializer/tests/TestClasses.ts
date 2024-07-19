import {
  jsonAttribute,
  jsonProperty,
} from '../../inject/src/annotation/JsonPropertyAnnotation';
import {serializable} from '../../inject/src/annotation/SerializableAnnotation';

@serializable()
export class TestSerializable {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(String, {propertyName: 'organization'})
    public readonly company: string
  ) {}

  serialize() {
    return {
      firstName: this.name,
      company: this.company,
    };
  }
}

@serializable()
export class TestAttributeSerializable {
  constructor(
    @jsonProperty(String)
    public readonly firstName: string,
    @jsonProperty(String, {propertyName: 'organization'})
    public readonly company: string
  ) {}

  @jsonAttribute()
  public readonly lastName: string = 'Cervera';
  @jsonAttribute()
  public readonly city: string = 'NewYork';
  @jsonAttribute()
  public readonly underlying: TestSerializable = new TestSerializable(
    this.firstName,
    this.company
  );

  @jsonAttribute()
  public get email(): string {
    return `${this.firstName}@${this.company}.com`.toLowerCase();
  }
}

@serializable()
export class TestBadSerializable {
  constructor(public readonly name: string) {}
}

@serializable({allowEmpty: true})
export class TestEmptySerializable {
  constructor() {}
}

@serializable({isWrapper: true})
export class TestWrapperSerializable {
  constructor(
    @jsonProperty(String)
    public readonly name: string
  ) {}
}

@serializable()
export class TestIgnoreWrapperSerializable {
  constructor(
    @jsonProperty(TestWrapperSerializable)
    public readonly wrapped: TestWrapperSerializable,
    @jsonProperty(TestWrapperSerializable, {ignoreWrap: true})
    public readonly ignoredWrap: TestWrapperSerializable
  ) {}
}

@serializable()
export class TestStringifiedSerializable {
  constructor(
    @jsonProperty(TestSerializable, {isStringified: true})
    public readonly serializable: TestSerializable
  ) {}
}

@serializable()
export class TestDateSerializable {
  constructor(
    @jsonProperty(Date)
    public readonly date: Date | number
  ) {}
}

@serializable()
export class TestSerializeFnWithSerializable {
  constructor(public readonly name: string) {}

  serialize() {
    return {
      myName: this.name,
    };
  }
}

export class TestSerializeFn {
  constructor(
    @jsonProperty(String, {propertyName: 'group'})
    public readonly team: string,
    public readonly age: number
  ) {}

  serialize() {
    return {
      teamName: this.team,
      age: this.age,
    };
  }
}

export class TestSerializeJsonProp {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(String, {propertyName: 'team'})
    public readonly company: string
  ) {}
}

export class TestClassOnly {
  constructor(public readonly city: string) {}
}

export abstract class Vehicle {
  public abstract model: number;
  public abstract isWorking: boolean;
  public abstract __typename: string;
  constructor(
    @jsonProperty(String)
    public readonly make: string
  ) {}
}

@serializable()
export class Car extends Vehicle {
  @jsonAttribute()
  public __typename: string;

  constructor(
    @jsonProperty(String)
    public readonly make: string,
    @jsonProperty(Number)
    public readonly model: number,
    @jsonProperty(Boolean)
    public readonly isWorking: boolean
  ) {
    super(make);
    this.__typename = this.constructor.name;
  }
}

@serializable()
export class SubJsonPropertySubClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(Vehicle, {
      subTypes: {
        typeProperty: '__typename',
        typeMap: {
          Car,
        },
      },
    })
    public readonly vehicle: Vehicle
  ) {}
}

@serializable()
export class SubJsonPropertyStringifiedSubClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(Vehicle, {
      isStringified: true,
      subTypes: {
        typeProperty: '__typename',
        typeMap: {
          Car,
        },
      },
    })
    public readonly vehicle: Vehicle
  ) {}
}

@serializable()
export class SubJsonPropertyArraySubClass {
  constructor(
    @jsonProperty(String)
    public readonly name: string,
    @jsonProperty(Vehicle, {
      isArray: true,
      subTypes: {
        typeProperty: '__typename',
        typeMap: {
          Car,
        },
      },
    })
    public readonly vehicles: Vehicle[]
  ) {}
}
