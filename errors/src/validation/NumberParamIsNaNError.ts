import {ValidationError} from './ValidationError';

export class NumberParamIsNaNError extends ValidationError {
  constructor(public readonly paramName: string) {
    super(`Param ${paramName} is expected to be a number but is not a number`);
  }
}
