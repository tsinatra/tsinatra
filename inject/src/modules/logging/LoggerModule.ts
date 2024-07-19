import {Logger} from '@aws-lambda-powertools/logger';
import {Container, interfaces} from 'inversify';
import {inject, injectable} from '../../annotation/InjectorAnnotations';
import {env} from '../../annotation/LambdaAnnotations';
import {LambdaBinding} from '../../bindings/LambdaBinding';
import {Module} from '../Module';

/**
 * Injects a Logger instance.
 * Required Environment Variables:
 * 1. `SERVICE_NAME` ->
 *        Sets the name of service of which the Lambda function is part of. All logs will print the serviceName.
 *
 * Additionally, it automatically pulls the following environment variables:
 * 1. `LOG_LEVEL` ->
 *        Sets how verbose Logger should be. Options: `debug`, `info`, `warn`, `error`, `silent`
 * 2. `POWERTOOLS_LOGGER_SAMPLE_RATE` ->
 *        Probability that a Lambda invocation will print all the log items regardless of the log level setting
 */
@injectable()
export class LoggerModule extends Module {
  // The root logger.
  private readonly logger: Logger;

  // Cache of named loggers.
  private readonly namedLoggers: Map<string, Logger>;

  constructor(
    @inject(Container) protected readonly container: Container,
    @inject(LambdaBinding.Name) protected readonly lambdaName: string,
    @env('SERVICE_NAME') protected readonly serviceName: string
  ) {
    super(container);
    this.logger = new Logger({
      serviceName,
      persistentLogAttributes: {
        loggerName: lambdaName,
      },
    });
    this.namedLoggers = new Map();
  }

  configure(): void {
    // Bind logger to DI Container.
    this.container
      .bind<Logger>(Logger)
      .toDynamicValue((context: interfaces.Context) => {
        const loggerName = this.getLoggerNameFromContext(context);

        return loggerName
          ? this.getOrCreateNamedLogger(loggerName)
          : this.logger;
      })
      .inTransientScope();
  }

  private getLoggerNameFromContext(context: interfaces.Context) {
    if (context.currentRequest.target.getNamedTag()) {
      // first we try with the named tag.
      return context.currentRequest.target.getNamedTag()!.value;
    } else if (
      typeof context.currentRequest.parentRequest?.serviceIdentifier ===
      'function'
    ) {
      // then we try with the parentRequest serviceIdentifier
      // it should be the serviceIdentifier for the class in which we want to inject this logger to
      return context.currentRequest.parentRequest.serviceIdentifier.name;
    } else {
      // If serviceIdentifier is not a constructor, or there's no parent request, then we return undefined.
      return undefined;
    }
  }

  private getOrCreateNamedLogger(loggerName: string): Logger {
    let namedLogger = this.namedLoggers.get(loggerName);

    if (namedLogger) {
      return namedLogger;
    } else {
      namedLogger = this.logger.createChild();
      namedLogger.appendKeys({
        loggerName: loggerName,
      });
      this.namedLoggers.set(loggerName, namedLogger);
      return namedLogger;
    }
  }
}
