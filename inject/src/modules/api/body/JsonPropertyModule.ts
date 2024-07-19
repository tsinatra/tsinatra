import {interfaces} from 'inversify';
import {MissingRequiredJsonPropertyError} from '../../../../../errors/src/serializer/MissingRequiredJsonPropertyError';
import {TsinatraSerializer} from '../../../../../serializer/src/TsinatraSerializer';
import {injectable} from '../../../annotation/InjectorAnnotations';
import {ApiBinding} from '../../../bindings/ApiBinding';
import {Module} from '../../Module';

@injectable()
export class JsonPropertyModule extends Module {
  configure(): void {
    this.container
      .bind(ApiBinding.JsonProperty)
      .toDynamicValue((context: interfaces.Context) => {
        const object = context.container.get<any>(ApiBinding.JsonBody) ?? {};

        const fieldMetadatas = context.currentRequest.target.metadata;

        const propertyName =
          TsinatraSerializer.deserializer.getJsonPropertyName(fieldMetadatas);
        const propertyOptions =
          TsinatraSerializer.deserializer.getJsonPropertyOptions(
            fieldMetadatas
          );

        const objectToDeserialize = object[propertyName];
        const propertyType =
          TsinatraSerializer.deserializer.getJsonPropertyType(fieldMetadatas);

        if (object === undefined || object === null) {
          throw new MissingRequiredJsonPropertyError(
            propertyName,
            propertyType,
            object,
            propertyOptions
          );
        }

        const deserialized = TsinatraSerializer.deserialize(
          propertyType,
          objectToDeserialize,
          propertyOptions
        );

        if (
          (deserialized !== undefined && deserialized !== null) ||
          TsinatraSerializer.deserializer.isOptionalField(
            fieldMetadatas,
            propertyOptions
          )
        ) {
          return deserialized;
        } else {
          throw new MissingRequiredJsonPropertyError(
            propertyName,
            propertyType,
            objectToDeserialize,
            propertyOptions
          );
        }
      })
      .inTransientScope();
  }
}
