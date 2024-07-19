import {SerializerOptions} from '../../../serializer/src/SerializerOptions';
import {ApiBinding} from '../bindings/ApiBinding';
import {BindingDecorator, BindingType} from './BindingDecorator';

export interface ParamsOptions extends SerializerOptions {
  name?: string;
}

export const queryParam = (klass?: BindingType, opts?: ParamsOptions) =>
  BindingDecorator.createTypeTaggedNamedInjectDecorator(
    ApiBinding.QueryParam,
    klass ?? String,
    opts?.name,
    opts
  );

export const pathParam = (klass?: BindingType, opts?: ParamsOptions) =>
  BindingDecorator.createTypeTaggedNamedInjectDecorator(
    ApiBinding.PathParam,
    klass ?? String,
    opts?.name,
    opts
  );

export const param = (klass?: BindingType, opts?: ParamsOptions) =>
  BindingDecorator.createTypeTaggedNamedInjectDecorator(
    ApiBinding.Param,
    klass ?? String,
    opts?.name,
    opts
  );

export const header = (
  name: string,
  klass?: BindingType,
  opts?: ParamsOptions
) =>
  BindingDecorator.createTypeTaggedNamedInjectDecorator(
    ApiBinding.Header,
    klass ?? String,
    name,
    opts
  );
