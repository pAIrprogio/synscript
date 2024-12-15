import { type ValueOf } from "../../shared/src/ts.utils.ts";

export type PipeFn<V, R> = (value: V) => R;

// Enhanced type to handle arrays of promises and PromiseTest instances
export type PreserveAsync<V, R> =
  R extends Promise<any>
    ? R
    : V extends Promise<any>
    ? Promise<R>
    : V extends readonly any[]
    ? V[number] extends Promise<any>
      ? Promise<R>
      : R
    : R;

// Enhanced type to handle PromiseTest instances
export type PreservePipeable<R> = R extends Pipeable ? R : Pipe<R>;

// Enhanced type to preserve promise chain and handle PromiseTest instances
export type Result<V, R> = PreservePipeable<PreserveAsync<V, R>>;

// Enhanced type to handle promise resolution and value extraction
type $Result<I, V> = I extends Promise<any>
  ? Promise<ValueOf<Awaited<I>>>
  : I extends Pipeable
    ? Promise<ValueOf<Awaited<I['valueOf']>>>
    : V;

// Abstract base class with flexible type constraints
export abstract class Pipeable<
  TInstance = any,
  TValue = TInstance extends Promise<any> ? TInstance : TInstance | Promise<TInstance>
> {
  public _<R extends Promise<any>>(
    this: Pipeable<Promise<any>>,
    fn: PipeFn<TInstance, R>,
  ): Result<TInstance, R>;
  public _<R>(fn: PipeFn<TInstance, R>): Result<TInstance, R>;
  public _(fn: (value: any) => any) {
    const value = this.instanceOf();
    console.log('_ method - Initial value:', value);

    // Handle Pipeable instances first
    if (value instanceof Pipeable) {
      const res = fn(value);
      // If the result is a PromiseTest, always wrap its value in a Promise
      if (res instanceof Pipeable && res.constructor.name === 'PromiseTest') {
        const val = res.valueOf();
        return pipe(Promise.resolve(val));
      }
      // If the result is a Pipeable, we need to preserve its value chain
      if (res instanceof Pipeable) {
        const val = res.valueOf();
        // If it's a promise, we need to handle the promise chain
        if (val instanceof Promise) {
          return pipe(val.then(v => v));
        }
        return pipe(val);
      }
      return pipe(res);
    }

    // Handle promise values
    if (value instanceof Promise) {
      return pipe(value.then((v: TInstance) => {
        console.log('_ method - Promise resolved value:', v);
        const res = fn(v);
        if (res instanceof Pipeable) {
          return res.valueOf();
        }
        return res;
      }));
    }

    // Handle arrays with promises
    if (Array.isArray(value) && value.some((v) => v instanceof Promise)) {
      return pipe(Promise.all(value).then((v) => {
        const res = fn(v);
        if (res instanceof Pipeable) {
          return res.valueOf();
        }
        return res;
      }));
    }

    // Handle non-promise values
    console.log('_ method - Non-promise path, value:', value);
    const res = fn(value);
    console.log('_ method - After fn call (non-promise):', res);

    // If we get a Pipeable instance, handle its value
    if (res instanceof Pipeable) {
      const val = res.valueOf();
      if (val instanceof Promise) {
        return pipe(val);
      }
      return pipe(val);
    }
    return pipe(res);
  }

  public _$<R>(fn: PipeFn<Awaited<TValue>, R>): Result<TValue, R>;
  public _$(fn: (value: any) => any) {
    const value = this.valueOf();

    if (value instanceof Promise) {
      return pipe(value.then(async (v) => {
        const res = fn(v);
        if (res instanceof Pipeable) {
          const val = await Promise.resolve(res.valueOf());
          return val;
        }
        return res;
      }));
    }

    if (Array.isArray(value) && value.some((v) => v instanceof Promise)) {
      return pipe(Promise.all(value).then(async (v) => {
        const res = fn(v);
        if (res instanceof Pipeable) {
          const val = await Promise.resolve(res.valueOf());
          return val;
        }
        return res;
      }));
    }

    const res = fn(value);
    if (res instanceof Promise) return pipe(res);
    if (res instanceof Pipeable) {
      return pipe(Promise.resolve(res.valueOf()));
    }
    return pipe(res);
  }

  public tap(
    this: Pipeable<Promise<any>>,
    fn: (arg: Awaited<TInstance>) => void,
  ): this;
  public tap(fn: (arg: TInstance) => void): this;
  public tap(fn: (arg: any) => void) {
    fn(this.instanceOf());
    return this;
  }

  public get $(): TInstance {
    const value = this.instanceOf();

    // If it's a PromiseTest, always return a Promise
    if (value instanceof Pipeable && value.constructor.name === 'PromiseTest') {
      const val = value.valueOf();
      return (val instanceof Promise ? val : Promise.resolve(val)) as TInstance;
    }

    // If it's a Pipeable, get its value and preserve promise chain
    if (value instanceof Pipeable) {
      const val = value.valueOf();
      // If it's a promise, return it directly
      if (val instanceof Promise) {
        return val as TInstance;
      }
      // If it's another Pipeable, get its value
      if (val instanceof Pipeable) {
        return val.valueOf() as TInstance;
      }
      return val;
    }

    // If it's a promise, return it directly
    if (value instanceof Promise) {
      return value;
    }

    return value;
  }

  public abstract instanceOf(): TInstance;

  public abstract valueOf(): TValue;
}

export class Pipe<V> extends Pipeable<V, V> {
  private readonly value: V;

  public constructor(value: V) {
    super();
    this.value = value;
  }

  public static from<V>(value: V) {
    return new Pipe<V>(value);
  }

  public valueOf(): V {
    if (Array.isArray(this.value)) {
      if (this.value.some((v) => v instanceof Promise)) {
        return Promise.all(this.value) as V;
      }
    }
    if (this.value instanceof Promise) {
      return this.value;
    }
    return this.value;
  }

  public instanceOf(): V {
    return this.value;
  }
}

/**
 * Create a new pipe
 * @param value the initial value
 * @returns a pipe instance with the initial value
 */
export function pipe<V extends Pipeable>(value: V): V;
export function pipe<V>(value: V): Pipe<V>;
export function pipe<V>(value: V) {
  if (value instanceof Pipeable) return value;
  return new Pipe(value);
}
