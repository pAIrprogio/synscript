/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

export class Pipe<INPUT, OUTPUT> {
  private readonly _fns: Array<Pipe.Fn>;

  protected constructor(fns: Array<Pipe.Fn>) {
    this._fns = fns;
  }

  private append<NEW_OUTPUT>(fn: Pipe.Fn<Awaited<OUTPUT>, NEW_OUTPUT>) {
    return new Pipe<INPUT, Pipe.Return<OUTPUT, NEW_OUTPUT>>([...this._fns, fn]);
  }

  public static _<INPUT, OUTPUT>(fn: Pipe.Fn<INPUT, OUTPUT>) {
    return new Pipe<INPUT, OUTPUT>([fn]);
  }

  public _<NEW_OUTPUT>(fn: Pipe.Fn<Awaited<OUTPUT>, NEW_OUTPUT>) {
    return this.append<NEW_OUTPUT>(fn);
  }

  public tap(fn: Pipe.Fn<Awaited<OUTPUT>, void>) {
    return this.append<OUTPUT>((value) => {
      // Promises
      if (value instanceof Promise) {
        return value.then(fn).then(() => value) as OUTPUT;
      }

      // Synchronous
      fn(value);
      return value;
    });
  }

  public validate<T>(schema: ZodSchema<T>) {
    return this.append((value) => {
      // Promises
      if (value instanceof Promise) {
        return value.then((resolvedValue) => {
          return schema.parse(resolvedValue) as T;
        });
      }

      // Synchronous
      return schema.parse(value) as T;
    });
  }

  private isIterable<T>(value: any): value is Iterable<T> {
    return value != null && typeof value[Symbol.iterator] === "function";
  }

  private isAsyncIterable<T>(value: any): value is AsyncIterable<T> {
    return value != null && typeof value[Symbol.asyncIterator] === "function";
  }

  private *mapIterable<T, U>(
    fn: (value: T) => U,
    iterable: Iterable<T>,
  ): Iterable<U> {
    for (const item of iterable) {
      yield fn(item);
    }
  }

  private async *mapAsyncIterable<T, U>(
    fn: (value: T) => U,
    asyncIterable: AsyncIterable<T>,
  ): AsyncIterable<U> {
    for await (const item of asyncIterable) {
      yield fn(item);
    }
  }

  public map<T>(
    this: OUTPUT extends
      | Pipe.AsyncLoopable<any>
      | Promise<Pipe.AsyncLoopable<any>>
      ? Pipe<INPUT, OUTPUT>
      : never,
    fn: (value: Pipe.ElementOf<Awaited<OUTPUT>>) => T,
  ): Pipe<INPUT, Pipe.MapReturn<OUTPUT, T>> {
    return this.append((value) => {
      // Handle Promise values
      if (value instanceof Promise) {
        return value.then((resolvedValue) => {
          type ElemType = Pipe.ElementOf<Awaited<OUTPUT>>;
          if (this.isAsyncIterable<ElemType>(resolvedValue)) {
            return this.mapAsyncIterable(fn, resolvedValue);
          }
          if (this.isIterable<ElemType>(resolvedValue)) {
            return this.mapIterable(fn, resolvedValue);
          }
          throw new Error(
            `Cannot map over non-iterable value: ${typeof resolvedValue}`,
          );
        });
      }

      // Handle async iterables
      type ElemType = Pipe.ElementOf<Awaited<OUTPUT>>;
      if (this.isAsyncIterable<ElemType>(value)) {
        return this.mapAsyncIterable(fn, value);
      }

      // Handle sync iterables
      if (this.isIterable<ElemType>(value)) {
        return this.mapIterable(fn, value);
      }

      // Handle non-iterable values
      throw new Error(`Cannot map over non-iterable value: ${typeof value}`);
    }) as any;
  }

  private async arrayFromAsyncIterable(
    asyncIterable: AsyncIterable<unknown>,
  ): Promise<unknown[]> {
    const result = [];
    for await (const item of asyncIterable) {
      result.push(item);
    }
    return result;
  }

  public toArray(
    this: OUTPUT extends
      | Pipe.AsyncLoopable<any>
      | Promise<Pipe.AsyncLoopable<any>>
      ? Pipe<INPUT, OUTPUT>
      : never,
  ): Pipe<INPUT, Pipe.ToArrayReturn<OUTPUT>> {
    return this.append((value) => {
      // Handle Promise values
      if (value instanceof Promise) {
        return value.then(async (resolvedValue) => {
          if (this.isAsyncIterable<any>(resolvedValue)) {
            return this.arrayFromAsyncIterable(resolvedValue);
          }
          if (this.isIterable<any>(resolvedValue)) {
            return Array.from(resolvedValue);
          }
          throw new Error(
            `Cannot convert non-iterable value to array: ${typeof resolvedValue}`,
          );
        });
      }

      // Handle async iterables
      if (this.isAsyncIterable<any>(value)) {
        return this.arrayFromAsyncIterable(value);
      }

      // Handle sync iterables
      if (this.isIterable<any>(value)) {
        return Array.from(value);
      }

      // Handle non-iterable values
      throw new Error(
        `Cannot convert non-iterable value to array: ${typeof value}`,
      );
    }) as any;
  }

  public get exec() {
    const fns = this._fns;
    // Bind the functions to the input type
    return (input: INPUT) => {
      return fns.reduce(function piping(res, fn) {
        if (res instanceof Promise) {
          return res.then(fn);
        }
        return fn(res);
      }, input) as unknown as OUTPUT;
    };
  }
}

export declare namespace Pipe {
  type Fn<INPUT = any, OUTPUT = any> = (input: INPUT) => OUTPUT;

  // Type helpers inspired by iter-tools
  type AsyncLoopable<T> = Iterable<T> | AsyncIterable<T>;
  type Loopable<T> = Iterable<T>;

  // Type checkers
  type IsIterable<T> = T extends Iterable<any> ? true : false;
  type IsAsyncIterable<T> = T extends AsyncIterable<any> ? true : false;
  type IsPromise<T> = T extends Promise<any> ? true : false;

  // Extract element type from iterables
  type ElementOf<T> =
    T extends Iterable<infer U>
      ? U
      : T extends AsyncIterable<infer U>
        ? U
        : never;

  // Map return types
  type MapReturn<T, U> =
    T extends Promise<infer V>
      ? V extends AsyncIterable<any>
        ? Promise<AsyncIterable<U>>
        : V extends Iterable<any>
          ? Promise<Iterable<U>>
          : never
      : T extends AsyncIterable<any>
        ? AsyncIterable<U>
        : T extends Iterable<any>
          ? Iterable<U>
          : never;

  // ToArray return types
  type ToArrayReturn<T> =
    T extends Promise<infer V>
      ? V extends AsyncLoopable<infer U>
        ? Promise<U[]>
        : never
      : T extends AsyncIterable<infer U>
        ? Promise<U[]>
        : T extends Iterable<infer U>
          ? U[]
          : never;

  export namespace Infer {
    type Input<T extends Pipe<any, any>> =
      T extends Pipe<infer INPUT, any> ? INPUT : never;

    type Output<T extends Pipe<any, any>> =
      T extends Pipe<any, infer OUTPUT> ? OUTPUT : never;
  }

  export type Return<PREV_OUTPUT, NEXT_OUTPUT> =
    NEXT_OUTPUT extends Promise<any>
      ? NEXT_OUTPUT
      : PREV_OUTPUT extends Promise<any>
        ? Promise<NEXT_OUTPUT>
        : NEXT_OUTPUT;
}
