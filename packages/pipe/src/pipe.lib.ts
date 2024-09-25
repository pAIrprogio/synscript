// Todo: rework to handle promises + arrays, allow chains such as "batch"
export class Pipe<V> {
  private readonly _value: V;

  public constructor(value: V) {
    this._value = value;
  }

  /**
   * Pipe the current value through a function
   * @param fn the function to pipe the value through
   * @returns a pipe instance with the result as a new value
   */
  public _<R>(
    fn: (value: V) => R,
  ): R extends Promise<infer U> ? Promise<U> : Pipe<R> {
    const result = fn(this._value);
    if (result instanceof Promise)
      // @ts-expect-error - We know that result is Promise and it's tested
      return result;

    // @ts-expect-error - We know that result is non Promise and it's tested
    return new Pipe(result);
  }

  /**
   * Get the raw value
   * @alias valueOf
   * @returns the raw value
   */
  public get $(): V {
    return this._value;
  }

  public valueOf(): V {
    return this._value;
  }

  public toString(): string {
    return String(this._value);
  }
}

/**
 * Create a new pipe
 * @param value the initial value
 * @returns a pipe instance with the initial value
 */
export const pipe = <T>(value: T) => new Pipe(value);
