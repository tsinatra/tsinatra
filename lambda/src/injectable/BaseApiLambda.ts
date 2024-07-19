import middy from '@middy/core';
import {getClassNameOf} from '../../../utils';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import {Container} from 'inversify';
import {buildProviderModule} from 'inversify-binding-decorators';
import {ApiHandler} from 'sst/node/api';
import {BaseHandler} from '../../../handler/src/BaseHandler';
import {ApiBinding} from '../../../inject/src/bindings/ApiBinding';
import {LambdaBinding} from '../../../inject/src/bindings/LambdaBinding';
import {JsonBodyModule} from '../../../inject/src/modules/api/body/JsonBodyModule';
import {JsonPropertyModule} from '../../../inject/src/modules/api/body/JsonPropertyModule';
import {ParamsModule} from '../../../inject/src/modules/api/params/ParamsModule';
import {EnvModule} from '../../../inject/src/modules/lambda/EnvModule';
import {LoggerModule} from '../../../inject/src/modules/logging/LoggerModule';
import {MetricsModule} from '../../../inject/src/modules/metrics/MetricsModule';
import {ScopedMetricsModule} from '../../../inject/src/modules/metrics/ScopedMetricsModule';
import {Module} from '../../../inject/src/modules/Module';
import {BaseMiddleware} from '../../../middleware/src/BaseMiddleware';
import {ErrorHandlerMiddleware} from '../../../middleware/src/error/ErrorHandlerMiddleware';
import {ResponseLoggerMiddleware} from '../../../middleware/src/logging/ResponseLoggerMiddleware';
import {ApiMetricsMiddleware} from '../../../middleware/src/metrics/ApiMetricsMiddleware';
import {Constructor} from '../../../models/src/Constructor';
import {TsinatraSerializer} from '../../../serializer/src/TsinatraSerializer';
import {BaseLambda} from '../BaseLambda';

/**
 * Base class to create ApiLambdas.
 * An ApiLambda contains a DependencyInjection container used to instantiate modules. middlewares and handler
 *
 * The required fields for creating a new lambda are: `handler` and `request`.
 * - `handler` is the constructor of a class that extends from `BaseHandler`
 * - `request` is the constructor of a class of type TRequest
 *
 * The optional fields for creating a new lambda are: `modules` and `middlewares`.
 * - `modules` are used to declare any external dependency we have from our lambda/service and should be a list
 *   of classes that extend from `Module`
 * - `middlewares` are used to wrap our handler using the middleware pattern. Internally we use {@link https://middy.js.org/}
 *   to wrap the handler, this should be a list of classes that extend from `BaseMiddleware`
 *
 * e.g.
 * ```
 *   class ExampleHandler extends BaseHandler<EmptyRequest, string> { ... }
 *
 *   class ExampleModule extends Module { ... }
 *
 *   class ExampleMiddleware extends BaseMiddleware { ... }
 *
 *   class ExampleApiLambda extends BaseApiLambda<EmptyRequest, string> {
 *     handler = ExampleHandler;
 *     request = EmptyRequest;
 *     modules = [ExampleModule];
 *     middlewares = [ExampleMiddleware];
 *   }
 * ```
 */
export abstract class BaseApiLambda<TRequest, TResponse> extends BaseLambda<
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
> {
  /**
   * Dependency Injection container.
   * `autoBindInjectable: true` is an option we pass to the container to automatically bind injectable classes
   * to their own constructors. This option is necessary to simplify the development experience and avoid the need
   * of creating modules for a simple binding.
   * `skipsBaseClassChecks: true` is an option we pass to skip the base class check of having an `@injectable`
   * annotation and the number of arguments being greater than the subclass arguments.
   * These checks are not really helpful.
   *
   * @readonly
   */
  readonly container: Container = new Container({
    autoBindInjectable: true,
    skipBaseClassChecks: true,
  });

  /**
   * The core business logic of our handler.
   * This should be the constructor of a subclass of {@link BaseHandler}
   *
   * e.g.
   * ```
   *   class ExampleHandler extends BaseHandler<EmptyRequest, string> { ... }
   *
   *   class ExampleApiLambda extends BaseApiLambda<EmptyRequest, string> {
   *     handler = ExampleHandler
   *   }
   * ```
   *
   * @protected
   */
  protected abstract handler: Constructor<BaseHandler<TRequest, TResponse>>;

  /**
   * The request constructor that will be used to create the request object.
   * @protected
   */
  protected abstract request: Constructor<TRequest>;

  /**
   * Modules used to define the list of dependencies that get installed in our Handler in lambda scope
   *
   * e.g.
   * ```
   *   class MetricsModule extends Module { ... }
   *   class InfuraClientModule extends Module { ... }
   *
   *   class ExampleApiLambda extends BaseApiLambda {
   *     modules = [MetricsModule, InfuraClientModule]
   *   }
   * ```
   *
   * @protected
   */
  protected modules: Constructor<Module>[] = [];

  /**
   * Default modules that will be applied to all the implementations of BaseApiLambda.
   *
   * These are modules necessary by our default middlewares, and any module added here will apply to all the
   * lambdas that inherit from our `BaseApiLambda` class.
   *
   *  @private
   */
  private defaultModules(): Constructor<Module>[] {
    return [
      EnvModule,
      LoggerModule,
      MetricsModule,
      ScopedMetricsModule,
      JsonBodyModule,
      JsonPropertyModule,
      ParamsModule,
    ];
  }

  /**
   * Helper method that returns the list of all modules to be configured on this lambda.
   *
   *  @private
   */
  private allModules(): Constructor<Module>[] {
    return this.defaultModules().concat(this.modules);
  }

  /**
   * List of middlewares wrapping our handler.
   *
   * e.g.
   * ```
   *   class ExampleMiddleware extends BaseMiddleware { ... }
   *   class RequestResponseParsingMiddleware extends BaseMiddleware { ... }
   *
   *   class ExampleApiLambda extends BaseApiLambda {
   *     middlewares = [ExampleMiddleware, RequestResponseParsingMiddleware]
   *   }
   * ```
   *
   * @protected
   */
  protected middlewares: Constructor<
    BaseMiddleware<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>
  >[] = [];

  /**
   * Default middlewares that will be applied to all implementations of BaseApiLambda.
   *
   * These are middleware that provide core functionality for our lambda, and any middleware added here will
   * apply to all the lambdas that inherit from our `BaseApiLambda` class.
   *
   * @private
   */
  private defaultMiddlewares(): Constructor<
    BaseMiddleware<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>
  >[] {
    return [
      ApiMetricsMiddleware, // This is the first `before` and last `after` middleware.
      ResponseLoggerMiddleware,
      ErrorHandlerMiddleware,
    ];
  }

  /**
   * Helper method that returns the list of all middlewares to be used on this lambda.
   *
   *  @private
   */
  private allMiddlewares(): Constructor<
    BaseMiddleware<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>
  >[] {
    return this.defaultMiddlewares().concat(this.middlewares);
  }

  /**
   * Helper method that loads all the initial bindings to the root container.
   * The initial bindings are the root container, custom binding-decorators and modules.
   * @private
   */
  private loadContainerBindings(): void {
    // Bind Container to the container
    this.container.bind<Container>(Container).toConstantValue(this.container);
    // Bind Lambda Name
    this.container
      .bind<string>(LambdaBinding.Name)
      .toConstantValue(getClassNameOf(this));
    // Bind annotations using inversify-binding-decorators, e.g. custom @singleton annotation
    this.container.load(buildProviderModule());
    // Install all Modules
    for (const moduleClass of this.allModules()) {
      const module = this.container.get<Module>(moduleClass);

      module.configure();
    }
  }

  /**
   * Method that builds the Lambda Handler by
   *  1. Load all container bindings
   *  2. Creating a middyfiedHandler that can use middlewares
   *  3. Use all the middlewares configured for the handler
   *
   * @public
   * @readonly
   */
  public readonly buildLambdaHandler = () => {
    this.loadContainerBindings();

    let middyfiedHandler = middy(this.apiHandler);

    // Install Middlewares
    for (const middlewareClass of this.allMiddlewares()) {
      const middleware =
        this.container.get<
          BaseMiddleware<
            APIGatewayProxyEventV2,
            APIGatewayProxyStructuredResultV2
          >
        >(middlewareClass);

      middyfiedHandler = middyfiedHandler.use(middleware.createMiddleware());
    }

    return ApiHandler(middyfiedHandler);
  };

  /**
   * The actual handler that wraps the `handler` method from the `BaseHandler` class.
   * It automatically creates a request of type `TRequest` via dependency injection
   *  then converts the response into an `ApiGatewayProxyResultV2` object using the `serialize` method or `JSON.stringify`.
   * Errors will be caught by the {@link ErrorHandlerMiddleware}.
   */
  readonly apiHandler: (
    event: APIGatewayProxyEventV2,
    context: Context
  ) => Promise<APIGatewayProxyStructuredResultV2> = async (event, context) => {
    // Creates a new child container for the duration of each request
    const requestContainer = this.container.createChild();

    // Binds ApiGateProxyEvent to the requestContainer
    requestContainer
      .bind<APIGatewayProxyEventV2>(ApiBinding.Event)
      .toConstantValue(event);

    // Binds Context to the requestContainer
    requestContainer.bind<Context>(ApiBinding.Context).toConstantValue(context);

    // Gets the handler from the container. The handler should be `@singleton` to avoid resolving on each request
    const apiHandler = requestContainer.get<BaseHandler<TRequest, TResponse>>(
      this.handler
    );

    // Creates the request object using dependency injection
    // We can't use the Serializer to deserialize this request because this is not just for the JsonBody
    //  it could contain fields coming from other sources like env, queryParam, pathParam, etc.
    const apiRequest = requestContainer.get<TRequest>(this.request);

    // Calls the handler, any error thrown will bubble up and be caught by the `ErrorHandlingMiddleware`
    const apiResponse: TResponse = await apiHandler.handle(apiRequest);

    // Serializes the response
    const body: string = TsinatraSerializer.stringify(apiResponse);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    };
  };
}
