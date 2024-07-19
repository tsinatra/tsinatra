import {ValidationError} from '../ValidationError';

export class MissingRequiredEnvError extends ValidationError {
  constructor(public readonly envVarName: string) {
    super(`Missing required environment variable: ${envVarName}`);
  }
}
