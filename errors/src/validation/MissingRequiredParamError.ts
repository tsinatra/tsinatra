import {ValidationError} from './ValidationError';

export class MissingRequiredParamError extends ValidationError {
  constructor(
    public readonly paramName: string,
    fieldType: string
  ) {
    super(`Missing required ${fieldType}: ${paramName}`);
  }
}
