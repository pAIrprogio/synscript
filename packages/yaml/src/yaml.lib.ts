import YAML from "yaml";
import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";
import type { Stringable } from "../../shared/src/ts.utils.ts";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

/**
 * Deserializes YAML to a TypeScript type
 * @param data The YAML content to deserialize
 * @param options.schema Optional Zod schema to validate the data against after deserializing
 * @returns The deserialized data as a js entity
 */
export const deserialize = <SHAPE = unknown>(
  data: Stringable,
  options: { schema?: ZodSchema<SHAPE> } = {},
): SHAPE => {
  try {
    const validatedData = YAML.parse(data.toString());
    if (options.schema) return options.schema.parse(validatedData);
    return validatedData;
  } catch (error) {
    throw new Error(`Failed to parse YAML`, {
      cause: error,
    });
  }
};

/**
 * Serializes data to YAML
 * @param data The data to serialize
 * @param options.schema Optional Zod schema to validate the data against before serializing
 * @returns The yaml as a string
 */
export const serialize = <SHAPE = any>(
  data: SHAPE,
  options: { schema?: ZodSchema<any, SHAPE> } = {},
) => {
  try {
    const validatedData = options.schema ? options.schema.parse(data) : data;
    return YAML.stringify(validatedData, {
      blockQuote: "literal", // Avoid unnecessary whitespace on preview
    });
  } catch (error) {
    throw new Error(`Failed to serialize YAML`, {
      cause: error,
    });
  }
};
