import {HttpError} from '../../../errors/src/http/HttpError';
import {Constructor} from '../../../models/src/Constructor';
import {BindingDecorator} from './BindingDecorator';

export interface SerializableOptions {
  allowEmpty?: boolean;
  isWrapper?: boolean;
}

export const serializable = (
  opts: SerializableOptions = {allowEmpty: false, isWrapper: false}
) => {
  return function <T extends Constructor<unknown> | typeof HttpError>(
    target: T
  ) {
    Reflect.defineMetadata(BindingDecorator.serializableTag, opts, target);

    return target;
  };
};
