import {Logger} from '@aws-lambda-powertools/logger';
import {Metrics, MetricUnits} from '@aws-lambda-powertools/metrics';
import {SSMProvider} from '@aws-lambda-powertools/parameters/ssm';
import {inject} from 'inversify';
import kebabCase from 'just-kebab-case';
import {NumberParamIsNaNError} from '../../errors/src/validation/NumberParamIsNaNError';
import {env} from '../../inject/src/annotation/LambdaAnnotations';
import {singleton} from '../../inject/src/annotation/Singleton';
import {IParameterStore, ParameterStoreGetOptions} from './IParameterStore';

@singleton(ParameterStore)
export class ParameterStore extends IParameterStore {
  constructor(
    @inject(SSMProvider) protected readonly ssmProvider: SSMProvider,
    @env('SERVICE_NAME') protected readonly serviceName: string,
    @env('SST_STAGE') protected readonly stage: string,
    @inject(Metrics) protected readonly metrics: Metrics,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super();
  }

  async get(
    paramName: string,
    options: ParameterStoreGetOptions = {}
  ): Promise<string | undefined> {
    const before = Date.now();
    const parameterPath = this.parameterPath(paramName);

    try {
      this.logger.debug('Fetching Parameter', {parameterPath});
      const paramValue = await this.ssmProvider.get(parameterPath, {
        // defaults to caching for 5 minutes to limit the amount of requests to refresh it,
        // this param will be fetched in every instance of the lambda every `ttl` seconds
        maxAge: options.ttl || 300,
      });
      this.metrics.addMetric('ParameterStoreSuccess', MetricUnits.Count, 1);
      return paramValue ?? options.defaultValue;
    } catch (error) {
      this.metrics.addMetric('ParameterStoreFailure', MetricUnits.Count, 1);
      this.logger.error(
        'Failure while fetching Parameter',
        {error},
        {parameterPath}
      );

      // if we have a default value, return it when the param fetch fails.
      if (options.defaultValue) {
        this.metrics.addMetric('ParameterStoreDefault', MetricUnits.Count, 1);
        return options.defaultValue;
      }

      // throw the error if there's no default value.
      throw error;
    } finally {
      this.metrics.addMetric('ParameterStoreRequests', MetricUnits.Count, 1);
      this.metrics.addMetric(
        'ParameterStoreLatency',
        MetricUnits.Milliseconds,
        Date.now() - before
      );
    }
  }

  async getBoolean(
    paramName: string,
    options: ParameterStoreGetOptions<Boolean> = {}
  ): Promise<boolean | undefined> {
    const normalizedOptions = this.normalizedOptions(options);
    const param = await this.get(paramName, normalizedOptions);
    if (param) {
      return ['t', '1', 'true'].includes(param.toLowerCase());
    } else {
      return undefined;
    }
  }

  async getNumber(
    paramName: string,
    options: ParameterStoreGetOptions<Number> = {}
  ): Promise<number | undefined> {
    const param = await this.get(paramName, this.normalizedOptions(options));
    if (param) {
      const parsedNumber = Number(param);
      if (isNaN(parsedNumber)) {
        throw new NumberParamIsNaNError(this.parameterPath(paramName));
      } else {
        return parsedNumber;
      }
    } else {
      return undefined;
    }
  }

  private normalizedOptions(
    options: ParameterStoreGetOptions<Boolean | Number>
  ): ParameterStoreGetOptions {
    const defaultValue =
      options.defaultValue !== undefined
        ? options.defaultValue.toString()
        : undefined;

    return {
      ...options,
      defaultValue,
    };
  }

  private parameterPath(paramName: string): string {
    return `/${kebabCase(this.serviceName)}/${kebabCase(
      this.stage
    )}/${paramName}`;
  }
}
