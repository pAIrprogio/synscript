export class Pipe<INPUT, OUTPUT> {
  private readonly _fns: Array<Pipe.Fn>;

  private constructor(fns: Array<Pipe.Fn>) {
    this._fns = fns;
  }

  public static _<INPUT, OUTPUT>(fn: Pipe.Fn<INPUT, OUTPUT>) {
    return new Pipe<INPUT, OUTPUT>([fn]);
  }

  public _<NEW_OUTPUT>(fn: Pipe.Fn<Awaited<OUTPUT>, NEW_OUTPUT>) {
    return new Pipe<INPUT, Pipe.Return<OUTPUT, NEW_OUTPUT>>([...this._fns, fn]);
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
