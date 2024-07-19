import {interfaces} from 'inversify';
import {MissingEnvNameError} from '../../../../errors/src/validation/lambda/MissingEnvNameError';
import {MissingRequiredEnvError} from '../../../../errors/src/validation/lambda/MissingRequiredEnvError';
import {injectable} from '../../annotation/InjectorAnnotations';
import {LambdaBinding} from '../../bindings/LambdaBinding';
import {Module} from '../Module';

@injectable()
export class EnvModule extends Module {
  configure(): void {
    this.container
      .bind<string | undefined>(LambdaBinding.Env)
      .toDynamicValue((context: interfaces.Context) => {
        const envVarName = this.getEnvVarName(context);

        return this.getEnvVar(envVarName, context);
      })
      .inTransientScope();
  }

  protected getEnvVarName(context: interfaces.Context): string {
    const envVarName = context.currentRequest.target.getNamedTag()?.value;
    if (!envVarName) {
      throw new MissingEnvNameError();
    }
    return envVarName;
  }

  protected getEnvOverrides(
    context: interfaces.Context
  ): Record<string, string> {
    try {
      return context.container.get(LambdaBinding.EnvOverrides) as Record<
        string,
        string
      >;
    } catch (e) {
      // If there is no binding, return empty object.
      return {};
    }
  }

  protected getEnvVar(
    envVarName: string,
    context: interfaces.Context
  ): string | undefined {
    const envOverrides = this.getEnvOverrides(context);
    const envVar = envOverrides[envVarName] ?? process.env[envVarName];

    if (!envVar && !context.currentRequest.target.isOptional()) {
      throw new MissingRequiredEnvError(envVarName);
    }

    return envVar;
  }
}
