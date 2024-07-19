import {fluentProvide} from 'inversify-binding-decorators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const singleton = (identifier: any) => {
  return fluentProvide(identifier).inSingletonScope().done();
};
