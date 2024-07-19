// Type that represents a constructor function of class T
export type Constructor<T> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T;
