import { z } from "zod/v4";

export type BasePredicates<PREDICATES = never> =
  | { and: BasePredicates<PREDICATES>[] }
  | { or: BasePredicates<PREDICATES>[] }
  | { not: BasePredicates<PREDICATES> }
  | { always: true }
  | { never: true }
  | PREDICATES;

export interface QueryPredicate<NAME extends string, CONFIG, INPUT = unknown> {
  name: NAME;
  configSchema: z.ZodType<{ [key in NAME]: CONFIG }>;
  handler: (config: CONFIG) => (input: INPUT) => boolean;
  cacheKey?: (config: CONFIG, input: INPUT) => any;
}

export interface QueryPredicateConfig<
  NAME extends string,
  CONFIG,
  INPUT = unknown,
> {
  /**
   * Unique name for the predicate.
   * Used to identify the predicate in the query if the key is present in a query object.
   *
   * @example
   * ```ts
   * // For this predicate
   * const predicate = queryPredicate({
   *   name: "test",
   *   configSchema: z.string(),
   * });
   *
   * // This query will match the predicate
   * const query = {
   *   test: "test",
   * };
   * ```
   */
  name: NAME;
  /**
   * The schema used to validate the predicate key value.
   *
   * @example
   * ```ts
   * const predicate = queryPredicate({
   *   name: "test",
   *   configSchema: z.string(),
   *   handler: (config) => (input) => input === config,
   * });
   *
   * // This query will match the predicate
   * const query = {
   *   test: "value", // <--- The "value" must be a string
   * };
   * ```
   */
  configSchema: z.ZodType<CONFIG>;
  /**
   * The handler function that will be used to evaluate if the predicate matches the input.
   */
  handler: (config: CONFIG) => (input: INPUT) => boolean;
  /**
   * Use for costly evaluation of the predicate.
   * - When provided, the predicate's result will be cached using with the result of the key function.
   * - The function must return a serializable value.
   * - Object keys are re-ordered alphabetically to ensure consistent caching.
   */
  cacheKey?: (config: CONFIG, input: INPUT) => any;
  /**
   * @deprecated Use `cacheKey` instead.
   * @see {@link cacheKey}
   */
  key?: (config: CONFIG, input: INPUT) => any;
}

export function queryPredicate<NAME extends string, PARAMS, INPUT = unknown>(
  options: QueryPredicateConfig<NAME, PARAMS, INPUT>,
) {
  return {
    name: options.name,
    configSchema: z.object({
      [options.name]: options.configSchema,
    }) as { [key in NAME]: PARAMS },
    handler: options.handler,
    cacheKey: options.cacheKey ?? options.key,
  } as QueryPredicate<NAME, PARAMS, INPUT>;
}

type QuerySchemaReturn<EXTRA_SCHEMAS extends z.ZodTypeAny> = z.ZodType<
  BasePredicates | z.output<EXTRA_SCHEMAS>
>;

const alwaysSchema = z
  .object({
    always: z.literal(true),
  })
  .meta({ id: "always" });

const neverSchema = z
  .object({
    never: z.literal(true),
  })
  .meta({ id: "never" });

export function querySchema<EXTRA_SCHEMAS extends z.ZodTypeAny>(
  extras: EXTRA_SCHEMAS[],
) {
  const schema: QuerySchemaReturn<EXTRA_SCHEMAS> = z.union([
    z.object({
      get and() {
        return z.array(schema).min(2);
      },
    }),
    z.object({
      get or() {
        return z.array(schema).min(2);
      },
    }),
    z.object({
      get not() {
        return schema;
      },
    }),
    alwaysSchema,
    neverSchema,
    ...extras,
  ]) as z.ZodType<BasePredicates | z.infer<EXTRA_SCHEMAS>>;

  return schema;
}
