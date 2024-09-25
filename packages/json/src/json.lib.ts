import { type ZodSchema } from "zod";

// Todo: check if passing "zod" as peer dependency breaks the build

/**
 * Serializes data to JSON
 * @param data The data to serialize
 * @param config.pretty Whether to pretty print the JSON
 * @param config.schema Optional Zod schema to validate the data against before serializing
 * @returns The JSON as a string
 */
export const serialize = (
  data: any,
  config: { pretty?: boolean; schema?: ZodSchema<any> } = {},
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
export const deserialize = <T = unknown>(
  content: string,
  config: {
    schema?: ZodSchema<T>;
  } = {},
): T => {
  try {
    const validatedData = JSON.parse(content);
    if (config.schema) return config.schema.parse(validatedData);
    return validatedData as T;
  } catch (error) {
    throw new JsonParseException(content, error);
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
