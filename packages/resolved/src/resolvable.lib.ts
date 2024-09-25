export type Resolvable<T> = Promise<T> | T;

export declare namespace Resolvable {
  export type Infer<T> = Awaited<T>;
  export type IsPromise<T> = T extends Promise<any> ? true : never;

  namespace ArrayOf {
    export type Infer<T> = T extends readonly any[]
      ? {
          [K in keyof T]: Resolvable.Infer<T[K]>;
        }
      : never;

    export type HasPromise<T> = T extends readonly any[]
      ? {
          [K in keyof T]: Resolvable.IsPromise<T[K]>;
        }[number]
      : never;
  }

  namespace MaybeArray {
    export type Infer<T> = T extends readonly any[]
      ? { [K in keyof T]: Resolvable.Infer<T[K]> }
      : Resolvable.Infer<T>;

    export type IsPromise<T> = T extends readonly any[]
      ? { [K in keyof T]: Resolvable.IsPromise<T[K]> }[number]
      : Resolvable.IsPromise<T>;
  }
}

/**
 * Resolves all values in the array in parallel
 * @param value The array to resolve
 * @returns If the array contains promises, a promise of an array of values. Otherwise, the array.
 */
export const resolveAll = <U extends readonly any[]>(
  value: U,
): true extends Resolvable.ArrayOf.HasPromise<U>
  ? Promise<Resolvable.ArrayOf.Infer<U>>
  : U => {
  if (!Array.isArray(value)) throw new Error("Expected an array");
  // @ts-expect-error - We know that the value is not a promise
  if (value.some((v) => v instanceof Promise)) return Promise.all(value);
  // @ts-expect-error - We know that the value is not a promise
  return value;
};

export class Resolver<T extends Resolvable<any>> {
  private readonly _value: T;

  public constructor(value: T) {
    this._value = value;
  }

  /**
   * Get the value of the resolver
   * @returns The value or a single promise of the value
   *
   * - If the value is an array containing promises, the array will be resolved with `Promise.all`
   */
  public get $(): T extends readonly any[]
    ? true extends Resolvable.ArrayOf.HasPromise<T>
      ? Promise<Resolvable.ArrayOf.Infer<T>>
      : T
    : T {
    if (Array.isArray(this._value)) {
      // @ts-expect-error - We know that the value is an array
      return resolveAll(this._value);
    }
    // @ts-expect-error - We know that the value is not an array
    return this._value;
  }

  public valueOf(): T {
    return this._value;
  }

  /**
   * Apply a function to the value
   * @param fn the function to apply to the value
   * @returns a new Resolver instance with the result of the function, either a value or a promise of a value
   */
  public _<R>(
    fn: (value: Resolvable.MaybeArray.Infer<T>) => R,
  ): true extends Resolvable.MaybeArray.IsPromise<T>
    ? true extends Resolvable.MaybeArray.IsPromise<R>
      ? Resolver<R>
      : Resolver<Promise<R>>
    : Resolver<R> {
    if (Array.isArray(this._value)) {
      const hasPromise = this._value.some((v) => v instanceof Promise);
      if (hasPromise)
        // @ts-expect-error - We know that the value is a promise
        return new Resolver(Promise.all(this._value).then(fn));
      // @ts-expect-error - We know that the value is not a promise
      return new Resolver(fn(this._value));
    }
    if (this._value instanceof Promise)
      // @ts-expect-error - We know that the value is a promise
      return new Resolver(this._value.then(fn));
    // @ts-expect-error - We know that the value is not a promise
    return new Resolver(fn(this._value as Resolvable.Infer<T>));
  }
}

/**
 * A piping utility which preserves the sync/async state of the value
 * @param value The value to pipe
 * @returns A new Resolver instance
 *
 * ```ts
 * import { pipe } from "@synstack/resolved";
 *
 * // Sync
 * const value: string = pipe("Hello World")._((v) => v.toUpperCase()).$;
 *
 * // Async
 * const promiseValue: Promise<string> = pipe("Hello World")._((v) => Promise.resolve(v.toUpperCase())).$;
 * ```
 */
export const pipe = <T>(value: T) => {
  return new Resolver<T>(value);
};
