export type PipeFn<V, R> = (value: V) => R;

export abstract class Pipeable<TInstance = any, TValue = any> {
  public _<R extends Pipeable>(fn: PipeFn<TInstance, R>): R;
  public _<R extends Promise<any>>(fn: PipeFn<TInstance, R>): R;
  public _<R>(fn: PipeFn<TInstance, R>): Pipe<R>;
  public _<R>(fn: PipeFn<TInstance, R>): R | Pipe<R> {
    const value = this.instanceOf();

    const res = fn(value);
    if (res instanceof Promise) return res;
    if (res instanceof Pipeable) return res;
    return new Pipe(res);
  }

  public _$<R extends Pipeable<any, any>>(fn: PipeFn<TValue, R>): R;
  public _$<R extends Promise<any>>(fn: PipeFn<TValue, R>): R;
  public _$<R>(fn: PipeFn<TValue, R>): Pipe<R>;
  public _$<R>(fn: PipeFn<TValue, R>): R | Pipe<R> {
    const res = fn(this.valueOf());
    if (res instanceof Promise) return res;
    if (res instanceof Pipeable) return res;
    return new Pipe(res);
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
export function pipe<V extends Promise<any>>(value: V): V;
export function pipe<V>(value: V): Pipe<V>;
export function pipe<V>(value: V) {
  if (value instanceof Pipeable) return value;
  return new Pipe(value);
}
