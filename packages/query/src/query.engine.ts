import { z } from "zod/v4";
import {
  queryApply,
  queryPredicate,
  querySchema,
  type BasePredicates,
  type QueryPredicate,
} from "./query.lib.ts";

export class QueryEngine<PREDICATES = never, INPUT = never> {
  private predicates: Array<QueryPredicate<string, any, INPUT>>;
  private _schema: z.ZodType<BasePredicates<PREDICATES>>;

  protected constructor(predicates: Array<QueryPredicate<string, any, INPUT>>) {
    this.predicates = predicates;
    // Build schema once in constructor instead of rebuilding on every access
    this._schema = querySchema(
      this.predicates.map((p) => p.schema),
    ) as z.ZodType<BasePredicates<PREDICATES>>;
  }

  public static default<INPUT = never>() {
    return new QueryEngine<never, INPUT>([]);
  }

  public static addPredicate<NAME extends string, PARAM, INPUT>(
    name: NAME,
    params: z.ZodType<PARAM>,
    handler: (params: PARAM) => (input: INPUT) => boolean,
  ) {
    return new QueryEngine<{ [n in NAME]: PARAM }, INPUT>([
      queryPredicate(name, params, handler),
    ]);
  }

  public addPredicate<NAME extends string, PARAM>(
    name: NAME,
    params: z.ZodType<PARAM>,
    handler: (params: PARAM) => (input: INPUT) => boolean,
  ) {
    return new QueryEngine<PREDICATES | { [n in NAME]: PARAM }, INPUT>([
      ...this.predicates,
      queryPredicate(name, params, handler),
    ]);
  }

  public get schema() {
    return this._schema;
  }

  public get jsonSchema() {
    return z.toJSONSchema(this.schema);
  }

  public match(
    query: unknown,
    input: INPUT,
    options?: { skipQueryValidation?: boolean },
  ): boolean {
    return queryApply(this.predicates, query, input, options);
  }
}

export declare namespace QueryEngine {
  type InferInput<T extends QueryEngine<any, any>> =
    T extends QueryEngine<any, infer INPUT> ? INPUT : never;

  type InferQuery<T extends QueryEngine<any, any>> =
    T extends QueryEngine<infer PREDICATES, any>
      ? BasePredicates<PREDICATES>
      : never;
}
