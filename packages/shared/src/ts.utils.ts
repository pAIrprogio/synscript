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
 * Asserts that the value extends the expected type
 */
export function assertExtends<Expected, _Value extends Expected>(): void {}

export const assertType = <Expected, Value extends Expected = Expected>(
  _value: Value,
) => {};

export function never(neverCheck: never, value?: unknown): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(
    `Unexpected value, received: ${JSON.stringify(value ?? neverCheck, null, 2)}`,
  );
}
