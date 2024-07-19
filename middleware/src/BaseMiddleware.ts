import middy from '@middy/core';
import {Context} from 'aws-lambda';
import {injectable} from '../../inject/src/annotation/InjectorAnnotations';

/**
 * BaseMiddleware is a class that can be extended to create Middy-compatible
 * middleware. It is designed to make testing middleware that leverages dependency
 * injection easier.
 *
 * The class includes methods to handle the `before`, `after`, and `onError`
 * Middy hooks with default no-op implementations. Note that these hooks are deliberately
 * defined as arrow functions to give access to the instance attributes of the class, allowing
 * the hooks to use any injected dependencies and alter any middleware state.
 *
 * The class accepts four types of parameters based on the types that the middy MiddlewareObj expects:
 * 1. `TEvent`: The type of the event that gets passed to the lambda (default: any).
 * 2. `TResult`: The type of the result that the lambda returns (default: any).
 * 3. `TErr`: The type of any error that might occur during execution of the middleware or the lambda (default: Error).
 * 4. `TContext`: The type of the context object that the AWS lambda receives (default: Context).
 *
 * @example
 * class CustomMiddleware extends BaseMiddleware<MyEvent, MyResult> {
 *    before = (request) => { // custom logic here };
 *    after = (request) => { // custom logic here };
 *    onError = (request) => { // custom logic here };
 * }
 */
@injectable()
export class BaseMiddleware<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEvent = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TResult = any,
  TErr = Error,
  TContext extends Context = Context,
> {
  createMiddleware(): middy.MiddlewareObj<TEvent, TResult, TErr, TContext> {
    return {
      before: this.before,
      after: this.after,
      onError: this.onError,
    };
  }

  protected before: middy.MiddlewareFn<TEvent, TResult, TErr, TContext> = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: middy.Request<TEvent, TResult, TErr, TContext>
  ) => {};

  protected after: middy.MiddlewareFn<TEvent, TResult, TErr, TContext> = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: middy.Request<TEvent, TResult, TErr, TContext>
  ) => {};

  protected onError: middy.MiddlewareFn<TEvent, TResult, TErr, TContext> = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: middy.Request<TEvent, TResult, TErr, TContext>
  ) => {};
}
