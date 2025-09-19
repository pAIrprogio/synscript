import { z } from "zod/v4";

export type BasePredicates<PREDICATES = never> =
  | { and: BasePredicates<PREDICATES>[] }
  | { or: BasePredicates<PREDICATES>[] }
  | { not: BasePredicates<PREDICATES> }
  | { always: true }
  | { never: true }
  | PREDICATES;

export interface QueryPredicate<NAME extends string, PARAMS, INPUT = unknown> {
  name: NAME;
  schema: z.ZodType<{ [key in NAME]: PARAMS }>;
  handler: (params: PARAMS) => (content: INPUT) => boolean;
}

export function queryPredicate<NAME extends string, PARAMS, INPUT = unknown>(
  name: NAME,
  params: z.ZodType<PARAMS>,
  handler: (params: PARAMS) => (content: INPUT) => boolean,
) {
  return {
    name,
    schema: z.object({
      [name]: params,
    }),
    handler,
    // Todo: fix this
  } as unknown as QueryPredicate<NAME, PARAMS, INPUT>;
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

export function queryApply<
  PREDICATES extends Array<QueryPredicate<string, any, INPUT>>,
  INPUT,
>(
  predicates: PREDICATES,
  query: unknown,
  input: INPUT,
  options?: { skipQueryValidation?: boolean },
) {
  if (query === undefined) return false;

  const schema = querySchema(predicates.map((c) => c.schema));
  const parsedQuery = options?.skipQueryValidation
    ? (query as z.output<typeof schema>)
    : schema.parse(query);

  function apply(query: typeof parsedQuery, input: INPUT): boolean {
    if ("always" in query) {
      return true;
    }

    if ("never" in query) {
      return false;
    }

    if ("and" in query) {
      if (query.and.length === 0) return false;
      return query.and.every((q: BasePredicates) => apply(q, input));
    }

    if ("or" in query) {
      if (query.or.length === 0) return false;
      return query.or.some((q: BasePredicates) => apply(q, input));
    }

    if ("not" in query) {
      return !apply(query.not as BasePredicates, input);
    }

    return predicates.some((c) => {
      if (c.name in query) return c.handler(query[c.name])(input);
      return false;
    });
  }

  return apply(parsedQuery, input);
}
