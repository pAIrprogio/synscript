import { Resolvable } from "../resolvable.lib";

export type Callable<T> = T | (() => T);
export declare namespace Callable {
  export type Infer<T> = T extends () => infer U ? U : T;
  export type IsPromise<T> = T extends () => infer U
    ? Resolvable.IsPromise<U>
    : Resolvable.IsPromise<T>;
}

export type CallableResolvable<T> = Callable<Resolvable<T>>;

export declare namespace CallableResolvable {
  export type Infer<T> = Resolvable.Infer<Callable.Infer<T>>;

  export type IsPromise<T> = Resolvable.IsPromise<Callable.Infer<T>>;

  export type Return<T> =
    true extends IsPromise<T> ? Promise<Infer<T>> : Infer<T>;

  export type MaybeArray<T> =
    | CallableResolvable<T>
    | Array<CallableResolvable<T>>;

  export namespace MaybeArray {
    export type InferExact<T> = T extends readonly any[]
      ? { [K in keyof T]: CallableResolvable.Infer<T[K]> }
      : CallableResolvable.Infer<T>;
    export type Infer<T> = T extends readonly any[]
      ? Array<{ [K in keyof T]: CallableResolvable.Infer<T[K]> }[number]>
      : CallableResolvable.Infer<T>;
    export type IsPromise<T> = T extends readonly any[]
      ? { [K in keyof T]: CallableResolvable.IsPromise<T[K]> }[number]
      : CallableResolvable.IsPromise<T>;
    export type Return<T> =
      true extends IsPromise<T> ? Promise<Infer<T>> : Infer<T>;

    export type ArrayOf<T> = Array<MaybeArray<T>>;
    export namespace ArrayOf {
      export type InferExact<T extends readonly any[]> = {
        [K in keyof T]: MaybeArray.InferExact<T[K]>;
      };
      export type Infer<T extends readonly any[]> = Array<
        {
          [K in keyof T]: MaybeArray.Infer<T[K]>;
        }[number]
      >;
      export type IsPromise<T extends readonly any[]> = {
        [K in keyof T]: MaybeArray.IsPromise<T[K]>;
      }[number];
      export type Return<T extends readonly any[]> =
        true extends IsPromise<T> ? Promise<Infer<T>> : Infer<T>;
    }
  }
}

export const resolveNested = <T extends readonly any[]>(
  args: T,
): CallableResolvable.MaybeArray.ArrayOf.Return<T> => {
  // @ts-expect-error - Fix later
  if (args.length === 0) return [];

  const unresolvedValues = args.map((v) => {
    if (typeof v === "function") return v();
    if (Array.isArray(v))
      return v.map((sv) => (typeof sv === "function" ? sv() : sv));
    return v;
  });

  const isPromise = unresolvedValues.some((v) => {
    if (v instanceof Promise) return true;
    if (Array.isArray(v)) return v.some((v) => v instanceof Promise);
    return false;
  });

  // @ts-expect-error - We know that the values is not a promise
  if (!isPromise) return unresolvedValues;

  // @ts-expect-error - We know that the values is a promise
  return Promise.all(
    unresolvedValues.map((v) => (Array.isArray(v) ? Promise.all(v) : v)),
  );
};
