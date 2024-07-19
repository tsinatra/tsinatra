import {interfaces, METADATA_KEY} from 'inversify';
import {
  DecoratorTarget,
  tagParameter,
  tagProperty,
} from 'inversify/lib/annotation/decorator_utils';
import {Metadata} from 'inversify/lib/planning/metadata';

export type Newable<T> = interfaces.Newable<T>;
export type Abstract<T> = interfaces.Abstract<T>;

export type BindingType<T = unknown> =
  | Newable<T>
  | Abstract<T>
  | string
  | object;

export class BindingDecorator {
  // Metadata key pulled from https://github.com/inversify/InversifyJS/blob/51012171ab95553633315fb1b3c5d1ff76ddee63/src/annotation/inject.ts
  public static readonly injectTag = METADATA_KEY.INJECT_TAG;
  // Metadata key pulled from https://github.com/inversify/InversifyJS/blob/51012171ab95553633315fb1b3c5d1ff76ddee63/src/annotation/named.ts
  public static readonly namedTag = METADATA_KEY.NAMED_TAG;
  public static readonly parameterNameTag = 'binding:parameter_name';
  public static readonly typeTag = 'binding:type';
  public static readonly optionsTag = 'binding:options';
  public static readonly serializableTag = 'binding:serializable';
  public static readonly jsonAttributesTag =
    'binding:serializable_json_attributes';

  // Creates an annotation with inject and named tags.
  // This is based on `createTaggedDecorator` function from inversify, modified to include the name and parameter name
  // https://github.com/inversify/InversifyJS/blob/master/src/annotation/decorator_utils.ts#L101-L115
  public static createNamedInjectDecorator<BindingType>(
    binding: BindingType,
    bindingName?: string,
    additionalMetadata: Metadata[] = []
  ) {
    return <T>(
      target: DecoratorTarget,
      targetKey?: string | symbol,
      indexOrPropertyDescriptor?: number | TypedPropertyDescriptor<T>
    ) => {
      const metadata = [
        new Metadata(BindingDecorator.injectTag, binding),
        ...additionalMetadata,
      ];

      if (typeof indexOrPropertyDescriptor === 'number') {
        const paramNames = BindingDecorator.getConstructorParamNames(target);

        metadata.push(
          new Metadata(
            BindingDecorator.namedTag,
            bindingName ?? paramNames[indexOrPropertyDescriptor]
          ),
          new Metadata(
            BindingDecorator.parameterNameTag,
            paramNames[indexOrPropertyDescriptor]
          )
        );

        tagParameter(target, targetKey, indexOrPropertyDescriptor, metadata);
      } else {
        metadata.push(
          new Metadata(BindingDecorator.namedTag, bindingName ?? targetKey)
        );
        tagProperty(target, targetKey as string | symbol, metadata);
      }
    };
  }

  public static createTypeTaggedNamedInjectDecorator<Binding>(
    binding: Binding,
    bindingType: BindingType,
    bindingName?: string,
    bindingOptions: object = {}
  ) {
    return BindingDecorator.createNamedInjectDecorator(binding, bindingName, [
      new Metadata(BindingDecorator.typeTag, bindingType),
      new Metadata(BindingDecorator.optionsTag, bindingOptions),
    ]);
  }

  /**
   * Method used to extract the argument names from the constructor of our class.
   * We will assume that the argument names match the property names of the class, this
   *   should be a valid assumption if we are following the best practices defined in the framework.
   *
   * @param target
   * @private
   */
  private static getConstructorParamNames(target: DecoratorTarget): string[] {
    // We will pull the param names from the constructor by matching on the arguments received by it.
    // Since  SST passes `keepNames` to esbuild, the names of the parameters are the same as the TS source.
    if ('prototype' in target && target.prototype) {
      // Obtaining the constructor from the prototype.
      const constructor = target.prototype.constructor;
      const constructorCode = constructor.toString();
      // We turn the constructor to a string (which returns the source code), then pattern match on it
      // the pattern we are matching on is for the `constructor` function and all the arguments inside.
      // e.g. constructor(name,age,young=age<18)
      const argNamesMatch = constructorCode.match(/constructor\(([^)]*)\)/);

      // If we have a match, then we proceed with the parsing.
      if (argNamesMatch && argNamesMatch.length >= 2) {
        // At this point we have a match, the second element of it contains the arguments.
        // We split the arguments using the `,` to have an array of arguments.
        // e.g. [name, age, young=age<18].
        const allArguments = argNamesMatch[1].split(',');
        // We will iterate over this list to extract just the name.
        return allArguments.map(arg => {
          // arguments with default initializers will contain the initializer declaration.
          // we only care about the argument name, so we will make sure we remove the initalizer.
          // e.g. young=age<18. We split using `=` and then take only the first part.
          // If no initializer exists, then we should always have the element at position 0.
          // Lastly we trim to remove any whitespace at the beginning or end of the string.
          const argOnly = arg.split('=')[0].trim();
          // Now we will do some pattern analysis to confirm that we are using the correct argument name
          // since ESBuild might rename the arguments even though we are explicitly keeping names

          // First we will create a regular expression for the assignment of the argument name
          const propertyAssignmentRegex = new RegExp(
            `this\\.([^;]+)\\s*=\\s*${argOnly}`
          );
          // Then we find the match of the previous regex.
          const propertyAssignmentMatch = constructorCode.match(
            propertyAssignmentRegex
          );
          // If we have a match, we return it, that's our actual property name.
          if (propertyAssignmentMatch && propertyAssignmentMatch[1]) {
            // Get the property name from the assignment code
            const propertyName = propertyAssignmentMatch[1].trim();
            return propertyName;
          } else {
            throw new Error(
              `BindingDecorator name resolution failed, could not find property assignment from argument ${argOnly}`
            );
          }
        });
      }
    }
    // If we didn't match the constructor or the arguments, then we return an empty array
    return [];
  }
}
