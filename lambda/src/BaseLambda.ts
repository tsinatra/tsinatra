import {Context} from 'aws-lambda/handler';

/**
 * BaseLambda type to define the Lambda abstraction in the Tsinatra ecosystem.
 * This Abstract class looks very similar to the
 * {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/aws-lambda/handler.d.ts#L84 typed AWS Lambda Handler}
 * However, the typed Handler is just a type that is used by TS while compiling and typechecking.
 * Tsinatra benefits from having classes that can be referenced in runtime, and this abstraction provides consistency.
 * This abstract class helps with keeping that consistent in the library of different lambda implementations.
 */
export abstract class BaseLambda<TEvent, TResult> {
  /**
   * Builder method that takes no arguments and returns a function (event, context) => Promise<result>.
   * The function returned by this method is the function called by AWS Lambda.
   * @template TEvent - The event type of the lambda, e.g. ApiGatewayEvent, S3Event, CronEvent, etc.
   * @template TResult - The result type associated to the event. e.g. ApiGatewayResult, S3Result, CronResult, etc.
   */
  public abstract buildLambdaHandler(): (
    event: TEvent,
    context: Context
  ) => Promise<TResult> | void;
}
