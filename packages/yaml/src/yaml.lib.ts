import YAML from "yaml";
import type { ZodSchema } from "zod";
import type { Stringable } from "../../shared/src/ts.utils.ts";

/**
 * Deserializes YAML to a TypeScript type
 * @param data The YAML content to deserialize
 * @param options.schema Optional Zod schema to validate the data against after deserializing
 * @returns The deserialized data as a js entity
 */
export const deserialize = <TFormat = any>(
  data: Stringable,
  options: { schema?: ZodSchema<TFormat> } = {},
) => {
  const validatedData = YAML.parse(data.toString());
  if (options.schema) return options.schema.parse(validatedData);
  return validatedData as TFormat;
};

/**
 * Serializes data to YAML
 * @param data The data to serialize
 * @param options.schema Optional Zod schema to validate the data against before serializing
 * @returns The yaml as a string
 */
export const serialize = <TFormat = any>(
  data: any,
  options: { schema?: ZodSchema<TFormat> } = {},
) => {
  const validatedData = options.schema ? options.schema.parse(data) : data;
  return YAML.stringify(validatedData, {
    blockQuote: "literal", // Avoid unnecessary whitespace on preview
  });
};
