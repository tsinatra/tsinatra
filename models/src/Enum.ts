export class Enum {
  /**
   * Number-based enums have a double mapping, we need to remove the number => string mapping.
   * @param enumType
   */
  static getValues<T = string | number>(enumType: object): T[] {
    return Object.entries(enumType)
      .filter(([key, _value]) => isNaN(parseInt(key))) // if key is a number, we want to remove it
      .map(([_key, value]) => value);
  }
}
