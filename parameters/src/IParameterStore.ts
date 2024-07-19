export interface ParameterStoreGetOptions<DefaultType = string> {
  defaultValue?: DefaultType;
  ttl?: number;
}

export abstract class IParameterStore {
  abstract get(
    paramName: string,
    options?: ParameterStoreGetOptions
  ): Promise<string | undefined>;

  abstract getBoolean(
    paramName: string,
    options?: ParameterStoreGetOptions<Boolean>
  ): Promise<boolean | undefined>;

  abstract getNumber(
    paramName: string,
    options?: ParameterStoreGetOptions<Number>
  ): Promise<number | undefined>;
}
