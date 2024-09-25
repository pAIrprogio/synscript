import YAML from "yaml";
import { ZodSchema } from "zod";

const deserialize = <T = unknown>(
  data: string,
  options: { schema?: ZodSchema<T> } = {},
) => {
  const validatedData = YAML.parse(data);
  if (options.schema) return options.schema.parse(validatedData);
  return validatedData as T;
};

const serialize = (data: any, options: { schema?: ZodSchema<any> } = {}) => {
  const validatedData = options.schema ? options.schema.parse(data) : data;
  return YAML.stringify(validatedData, {
    blockQuote: "literal", // Avoid unnecessary whitespace on preview
  });
};

export const yaml = {
  serialize,
  deserialize,
};

export default yaml;
