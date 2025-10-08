import { z } from "zod/v4";
import {
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

  private apply(query: { [x: string]: any }, input: INPUT): boolean {
    if ("always" in query) {
      return true;
    }

    if ("never" in query) {
      return false;
    }

    if ("and" in query) {
      if (query.and.length === 0) return false;
      return query.and.every((q: BasePredicates) => this.apply(q, input));
    }

    if ("or" in query) {
      if (query.or.length === 0) return false;
      return query.or.some((q: BasePredicates) => this.apply(q, input));
    }

    if ("not" in query) {
      return !this.apply(query.not as BasePredicates, input);
    }

    return this.predicates.some((c) => {
      if (c.name in query) return c.handler(query[c.name])(input);
      return false;
    });
  }

  public match(
    query: unknown,
    input: INPUT,
    options?: { skipQueryValidation?: boolean },
  ): boolean {
    if (query === undefined) return false;

    const schema = querySchema(this.predicates.map((c) => c.schema));
    const parsedQuery = options?.skipQueryValidation
      ? (query as z.output<typeof schema>)
      : schema.parse(query);

    return this.apply(parsedQuery, input);
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
