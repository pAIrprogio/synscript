export type PipelineFn<I, O> = (input: I) => O;

export class Pipeline<I, O> {
  private readonly fns: Array<(value: any) => any>;

  public constructor(fns: Array<(value: any) => any>) {
    this.fns = fns.slice();
  }

  public _<R>(fn: PipelineFn<O, R>): Pipeline<I, R> {
    return new Pipeline<I, R>([...this.fns, fn]);
  }

  public apply(value: I): O {
    let result: any = value;
    for (const fn of this.fns) {
      if (result instanceof Promise) {
        result = result.then(fn);
      } else {
        const r = fn(result);
        result = r;
      }
    }
    return result as O;
  }

  public $(value: I): O {
    return this.apply(value);
  }
}

export const pipeline = {
  _<I, O>(fn: PipelineFn<I, O>): Pipeline<I, O> {
    return new Pipeline<I, O>([fn]);
  },
};
