import { type ValueOf } from "../../shared/src/ts.utils.ts";

export type PipeFn<V, R> = (value: V) => R;
export type PreserveAsync<V, R> =
  R extends Promise<any> ? R : V extends Promise<any> ? Promise<R> : R;
export type PreservePipeable<R> = R extends Pipeable ? R : Pipe<R>;
export type Result<V, R> = PreservePipeable<PreserveAsync<V, R>>;
type $Result<I, V> = I extends Promise<any> ? Promise<ValueOf<Awaited<I>>> : V;

export abstract class Pipeable<TInstance = any, TValue = any> {
  /**
   * Pipe the instance's value through a function
   * @param fn - The function to pipe the value with
   * @returns A new pipeable instance with the result of the function
   */
  public _<R extends Promise<any>>(
    this: Pipeable<Promise<any>>,
    fn: PipeFn<TInstance, R>,
  ): Result<TInstance, R>;
  public _<R>(fn: PipeFn<TInstance, R>): Result<TInstance, R>;
  public _(fn: (value: any) => any) {
    const value = this.instanceOf();

    // If the value is a promise, we pipe its value
    if (value instanceof Promise)
      return pipe(value.then((v: TInstance) => fn(v)));

    // Otherwise, we apply the function and return the result
    const res = fn(value);
    if (res instanceof Pipeable) return res;
    return new Pipe(res);
  }

  public _$<R>(fn: PipeFn<Awaited<TValue>, R>): Result<TValue, R>;
  public _$(fn: (value: any) => any) {
    const value = this.valueOf();

    if (value instanceof Promise) return pipe(value.then(fn));

    const res = fn(this.valueOf());
    if (res instanceof Promise) return res;
    if (res instanceof Pipeable) return res;
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

  public get $(): TValue {
    return this.valueOf();
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
    return this.value;
  }

  public instanceOf(): V {
    return this.value;
  }
}

// Todo: merge with resolved pipe

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
