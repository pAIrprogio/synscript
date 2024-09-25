import { ZodSchema } from "zod";

export const serialize = (
  data: any,
  config: { pretty?: boolean; schema?: ZodSchema<any> } = {},
) => {
  const validatedData = config.schema ? config.schema.parse(data) : data;
  return JSON.stringify(validatedData, null, config.pretty ? 2 : undefined);
};

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

export const json = {
  serialize,
  deserialize,
};

export default json;
