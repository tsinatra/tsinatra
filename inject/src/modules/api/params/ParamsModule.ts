import {
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';
import {Container, inject, interfaces} from 'inversify';
import {useHeaders, usePathParams, useQueryParams} from 'sst/node/api';
import {InternalServerError} from '../../../../../errors/src/http/ServerSideError';
import {MissingParamNameError} from '../../../../../errors/src/validation/MissingParamNameError';
import {MissingRequiredParamError} from '../../../../../errors/src/validation/MissingRequiredParamError';
import {
  Abstract,
  BindingDecorator,
  Newable,
} from '../../../../../inject/src/annotation/BindingDecorator';
import {TsinatraSerializer} from '../../../../../serializer/src/TsinatraSerializer';
import {ParamsOptions} from '../../../annotation/ApiAnnotations';
import {injectable} from '../../../annotation/InjectorAnnotations';
import {ApiBinding} from '../../../bindings/ApiBinding';
import {Module} from '../../Module';

@injectable()
export class ParamsModule extends Module {
  constructor(
    @inject(Container)
    protected readonly container: Container
  ) {
    super(container);
  }

  configure(): void {
    // Configure QueryParam
    this.container
      .bind(ApiBinding.QueryParam)
      .toDynamicValue((context: interfaces.Context) => {
        return this.deserializeFromRequest(
          useQueryParams(),
          context,
          'query parameter'
        );
      })
      .inTransientScope();

    // Configure PathParam
    this.container
      .bind(ApiBinding.PathParam)
      .toDynamicValue((context: interfaces.Context) => {
        return this.deserializeFromRequest(
          usePathParams(),
          context,
          'path parameter'
        );
      })
      .inTransientScope();

    // Configure QueryParam or PathParam
    this.container
      .bind(ApiBinding.Param)
      .toDynamicValue((context: interfaces.Context) => {
        return this.deserializeFromRequest(
          {...useQueryParams(), ...usePathParams()},
          context,
          'parameter'
        );
      })
      .inTransientScope();

    // Configure Headers
    this.container
      .bind(ApiBinding.Header)
      .toDynamicValue((context: interfaces.Context) => {
        return this.deserializeFromRequest(useHeaders(), context, 'header');
      })
      .inTransientScope();
  }

  protected deserializeFromRequest(
    parameters:
      | APIGatewayProxyEventQueryStringParameters
      | APIGatewayProxyEventPathParameters,
    context: interfaces.Context,
    fieldType: string
  ): unknown {
    const objectType = this.getType(context);
    const objectName = this.getName(context);
    const options = this.getOptions(context);
    const object = this.getValue(
      objectName,
      parameters,
      context,
      fieldType,
      options
    );

    return TsinatraSerializer.deserialize(objectType, object, {
      ...options,
      strict: false,
    });
  }

  protected getType(context: interfaces.Context) {
    const typeMetadata = context.currentRequest.target.metadata.find(
      metadata => metadata.key === BindingDecorator.typeTag
    );

    const type =
      typeMetadata &&
      (typeMetadata.value as Newable<unknown> | Abstract<unknown> | object);

    if (!type) {
      throw new InternalServerError('Missing type.');
    }

    return type;
  }

  protected getName(context: interfaces.Context): string {
    const name = context.currentRequest.target.getNamedTag()?.value;
    if (!name) {
      throw new MissingParamNameError();
    }
    return name;
  }

  protected getOptions(context: interfaces.Context) {
    const optionsMetadata = context.currentRequest.target.metadata.find(
      metadata => metadata.key === BindingDecorator.optionsTag
    );

    const type = optionsMetadata && (optionsMetadata.value as ParamsOptions);

    return type ?? {};
  }

  protected getValue(
    paramName: string,
    parameters:
      | APIGatewayProxyEventQueryStringParameters
      | APIGatewayProxyEventPathParameters,
    context: interfaces.Context,
    fieldType: string,
    options: ParamsOptions
  ): string | undefined {
    const value = parameters[paramName];
    const isOptional =
      context.currentRequest.target.isOptional() || options.isOptional || false;

    if (!value && !isOptional) {
      throw new MissingRequiredParamError(paramName, fieldType);
    }

    return value;
  }
}
