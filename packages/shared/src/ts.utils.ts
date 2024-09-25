/**
 * Extracts the arguments from a function as an array
 */
export type Args<T> = T extends (...args: infer U) => any ? U : never;

/**
 * Extracts the argument at a specific index from a function as a type
 */
export type ArgAt<T, N extends number> = Args<T>[N];

/**
 * Set select properties of an object type to be optional
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Flattens complex types to a single object
 */
export type Flatten<T> = {
  [K in keyof T]: T[K];
};

/**
 * Merges two objects
 */
export type Merge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof T
    ? T[K]
    : K extends keyof U
      ? U[K]
      : never;
};

/**
 * Flattens the array values as single union type
 */
export type ArrayValue<T extends readonly any[]> = Flatten<T>[number];

/**
 * Allows using an array or a single value
 */
export type MaybeArray<T> = T | T[];

/**
 * One or more values
 */
export type OneToN<T> = [...T[], T];

/**
 * Asserts that the second type extends the first type
 */
export function assertExtends<Expected, _Value extends Expected>(): void {}

/**
 * Asserts that the value is of the expected type
 */
export const assertType = <Expected, Value extends Expected = Expected>(
  _value: Value,
) => {};

/**
 * Used to assert that a value is never in case of a switch/case
 */
export function never(neverCheck: never, value?: unknown): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(
    `Unexpected value, received: ${JSON.stringify(value ?? neverCheck, null, 2)}`,
  );
}
