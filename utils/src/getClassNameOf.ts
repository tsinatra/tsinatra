/**
 * A function to determine the class name of a given object.
 * @param object - The object whose class name is to be determined. It can be of any type.
 * @returns A string representing the class name of the object.
 *   The common returned values are:
 *     - Undefined
 *     - Object
 *     - Boolean
 *     - Number
 *     - String
 *     - Function
 *     - Symbol
 *     - BigInt
 *     - Null
 *     - Array
 *     - Set
 *     - Map
 *     - RegExp
 *     - Date
 */
export function getClassNameOf(object: any): string {
  if (object !== null && object !== undefined && object.constructor) {
    // If our object has a constructor, return the name of the constructor.
    return object.constructor.name;
  }
  // Otherwise, We call the `Object.prototype.toString` function with `.call(object)`
  //   passing `object` as its context.
  //   It returns a string in the format '[object Type]', where 'Type' is the type of the object.
  //   The result is then sliced from the 8th character to the second-last character.
  //   This is done to remove the '[object ' prefix and the ']' suffix.
  //   The `slice(8, -1)` effectively extracts just the 'Type' part from the string.
  return Object.prototype.toString.call(object).slice(8, -1);
}
