~~~~# @tsinatra/tsinatra

This package contains core base classes that help in the creation of injectable lambdas
and handlers that are also Middyfied.

As of now the only Lambda and Handler implemented are the ones for the APIGateway, that means
lambdas capable of handling `APIGatewayProxyEventV2 => APIGatewayProxyResultV2`.

To create a Lambda, we have to create a subclass of the [BaseApiLambda](lambda/src/BaseApiLambda.ts),
and configure it according to our needs.

The configurable variables are the following:
* `handler` **required & injected** - This should be the class (constructor) of the handler for
this lambda, which should be a subclass of [BaseHandler](handler/src/BaseHandler.ts).
`BaseApiLambda` uses Dependency Injection to resolve the handler, with all the dependencies
declared in `modules`.
* `modules` **optional && injected** - These are all the dependencies that our `handler`,
`middlewares` or even other `modules` may need to be resolved. It's an array of classes
(constructors) that should be a sublcass of [Module](inject/src/InjectorModule.ts).
* `middlewares` **optional && injected** - These are all the middlewares that we can optionally
add to our lambda. It's an array of classess (constructors) that should be a subclass of
[BaseMiddleware](middleware/src/BaseMiddleware.ts).

This `BaseApiLambda` includes by default an injected `Logger` and a
[ResponseLoggerMiddleware](middleware/src/logging/ResponseLoggerMiddleware.ts).

## Examples
TODO
