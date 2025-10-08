import { stableKey } from "@synstack/key";
import { z } from "zod/v4";
import {
  queryPredicate,
  querySchema,
  type BasePredicates,
  type QueryPredicate,
  type QueryPredicateConfig,
} from "./query.lib.ts";

export class QueryEngine<PREDICATES = never, INPUT = never> {
  private predicates: Array<QueryPredicate<string, any, INPUT>>;
  private _schema: z.ZodType<BasePredicates<PREDICATES>>;
  private _cache: Map<string, boolean>;

  protected constructor(predicates: Array<QueryPredicate<string, any, INPUT>>) {
    this.predicates = predicates;
    // Build schema once in constructor instead of rebuilding on every access
    this._schema = querySchema(
      this.predicates.map((p) => p.configSchema),
    ) as z.ZodType<BasePredicates<PREDICATES>>;
    this._cache = new Map();
  }

  public static default<INPUT = never>() {
    return new QueryEngine<never, INPUT>([]);
  }

  public static addPredicate<NAME extends string, PARAM, INPUT>(
    config: QueryPredicateConfig<NAME, PARAM, INPUT>,
  ) {
    return new QueryEngine<{ [n in NAME]: PARAM }, INPUT>([
      queryPredicate(config),
    ]);
  }

  public addPredicate<NAME extends string, PARAM>(
    config: QueryPredicateConfig<NAME, PARAM, INPUT>,
  ) {
    return new QueryEngine<PREDICATES | { [n in NAME]: PARAM }, INPUT>([
      ...this.predicates,
      queryPredicate(config),
    ]);
  }

  public get schema() {
    return this._schema;
  }

  public get jsonSchema() {
    return z.toJSONSchema(this.schema);
  }

  private apply(
    query: { [x: string]: any },
    input: INPUT,
    options?: { useCache?: boolean },
  ): boolean {
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

    return this.predicates.some((predicate) => {
      if (predicate.name in query) {
        const predicateConfig = query[predicate.name];

        // Check if the predicate is cached
        if (options?.useCache && predicate.key) {
          const hash = stableKey(predicate.key(predicateConfig, input));
          if (this._cache.has(hash)) return this._cache.get(hash)!;
        }

        const result = predicate.handler(predicateConfig)(input);

        // Cache the result
        if (options?.useCache && predicate.key) {
          const hash = stableKey(predicate.key(predicateConfig, input));
          this._cache.set(hash, result);
        }

        return result;
      }
      return false;
    });
  }

  public clearCache() {
    this._cache.clear();
  }

  public match(
    query: unknown,
    input: INPUT,
    options?: {
      /**
       * Skip validation of the input query.
       *
       * Recommended for performance when the query is known to be valid.
       */
      skipQueryValidation?: boolean;
      /**
       * Use the cache to store the results of predicates.
       * Recommended for performance improvements on big databases.
       */
      useCache?: boolean;
    },
  ): boolean {
    if (query === undefined) return false;

    // Validate the query on the engine's schema
    const schema = querySchema(this.predicates.map((c) => c.configSchema));
    const parsedQuery = options?.skipQueryValidation
      ? (query as z.output<typeof schema>)
      : schema.parse(query);

    return this.apply(parsedQuery, input, { useCache: options?.useCache });
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
