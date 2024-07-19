import {injectable} from '../../inject';

/**
 * Base class to create Handlers, which exposes the interface we will use at the {@link BaseApiLambda} for
 * building a generic lambda.
 *
 * The subclass of BaseHandler is required to implement the handler method as they deem necessary.
 *
 * Example usage:
 * ```
 *   class ExampleHandler extends BaseHandler<EmptyRequest, string> {
 *     handle = () => {
 *       return 'Hello World';
 *     }
 *   }
 * ```
 */
@injectable()
export abstract class BaseHandler<TRequest, TResponse> {
  abstract handle(request: TRequest): Promise<TResponse>;
}
