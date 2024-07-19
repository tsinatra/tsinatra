import {LambdaBinding} from '../bindings/LambdaBinding';
import {BindingDecorator} from './BindingDecorator';

export const env = (envName: string) =>
  BindingDecorator.createNamedInjectDecorator(LambdaBinding.Env, envName);
