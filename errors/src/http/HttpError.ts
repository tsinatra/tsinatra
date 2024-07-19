import {jsonProperty} from '../../../inject/src/annotation/JsonPropertyAnnotation';
import {serializable} from '../../../inject/src/annotation/SerializableAnnotation';

@serializable()
export class HttpError extends Error {
  protected constructor(
    @jsonProperty(Number)
    public statusCode: number,
    @jsonProperty(String)
    public errorName: string,
    @jsonProperty(String, {propertyName: 'message', isOptional: true})
    private _msg?: string,
    @jsonProperty(Object, {isOptional: true})
    public context?: unknown
  ) {
    super(_msg);
  }
}
