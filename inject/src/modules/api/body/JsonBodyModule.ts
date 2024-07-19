import {useJsonBody} from 'sst/node/api';
import {injectable} from '../../../annotation/InjectorAnnotations';
import {ApiBinding} from '../../../bindings/ApiBinding';
import {Module} from '../../Module';

@injectable()
export class JsonBodyModule extends Module {
  configure(): void {
    this.container
      .bind(ApiBinding.JsonBody)
      .toDynamicValue(() => {
        return useJsonBody();
      })
      .inTransientScope();
  }
}
