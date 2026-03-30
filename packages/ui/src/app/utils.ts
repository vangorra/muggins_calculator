import { cloneDeep, isArray, mergeWith } from 'lodash';
export class ObjectBuilder {
  private static readonly mergeWithCustomizer = (
    objValue: any,
    sourceValue: any
  ) => {
    if (isArray(sourceValue)) {
      return sourceValue;
    }

    return undefined;
  };

  public static newFromBase<T>(base: T, updates: RecursivePartial<T>): T {
    return ObjectBuilder.newFromBaseArray([base], updates);
  }

  public static newFromBaseArray<T>(
    bases: T[],
    updates: RecursivePartial<T>
  ): T {
    // Start with the default configuration.
    const newObject = cloneDeep(bases[0]);

    bases
      .slice(1)
      .forEach((base) =>
        mergeWith(newObject, base, ObjectBuilder.mergeWithCustomizer)
      );

    // Update with the latest updates.
    mergeWith(newObject, cloneDeep(updates), ObjectBuilder.mergeWithCustomizer);

    return newObject;
  }
}
