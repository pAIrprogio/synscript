import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";
import type { Stringable } from "../../shared/src/ts.utils.ts";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

/**
 * Serializes data to JSON
 * @param data The data to serialize
 * @param config.pretty Whether to pretty print the JSON
 * @param config.schema Optional Zod schema to validate the data against before serializing
 * @returns The JSON as a string
 */
export const serialize = <SHAPE = unknown>(
  data: SHAPE,
  config: { pretty?: boolean; schema?: ZodSchema<any, SHAPE> } = {},
) => {
  const validatedData = config.schema ? config.schema.parse(data) : data;
  return JSON.stringify(validatedData, null, config.pretty ? 2 : undefined);
};

/**
 * Deserializes JSON to a TypeScript type
 * @param content The JSON content to deserialize
 * @param config.schema Optional Zod schema to validate the data against after deserializing
 * @returns The deserialized data as a js entity
 */
export const deserialize = <SHAPE = unknown>(
  content: Stringable,
  config: {
    schema?: ZodSchema<SHAPE>;
  } = {},
): SHAPE => {
  try {
    const validatedData = JSON.parse(content.toString());
    if (config.schema) return config.schema.parse(validatedData);
    return validatedData;
  } catch (error) {
    throw new JsonParseException(content.toString(), error);
  }
};

export class JsonParseException extends Error {
  constructor(value: string, cause?: any) {
    const message = `
Failed to parse JSON

[JSON String Value]:
  ${value}

[Cause]:
  ${cause instanceof Error ? cause.message : String(cause)}
    `;

    super(message, { cause });
  }
}
