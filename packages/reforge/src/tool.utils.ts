import { json } from "@synstack/json";
import * as net from "net";
import pako from "pako";
import { z } from "zod";

export const RESPONSE_SUFFIX = "_RESPONSE";

const memoize = <TArgs extends Array<any>, TValue>(
  fn: (...args: TArgs) => TValue,
) => {
  let cache: { data: TValue } | undefined = undefined;
  return (...args: TArgs) => {
    if (cache === undefined) cache = { data: fn(...args) };
    return cache.data;
  };
};

export const getIpcClient = memoize(() => {
  return new Promise<net.Socket>((resolve, reject) => {
    const port = process.env.REFORGE_IPC_PORT;

    if (!port)
      throw new Error("No IPC port provided, cannot connect to parent process");

    const parsedPort = typeof port === "string" ? parseInt(port) : port;

    const client = net.connect(parsedPort, "localhost", () => {
      client.removeListener("error", reject);
      resolve(client);
    });

    client.once("error", reject);
  });
});

export interface ToolConfig<
  TName extends string,
  TRequestSchema extends z.ZodSchema | null,
  TResponseSchema extends z.ZodSchema = any,
> {
  name: TName;
  requestSchema: TRequestSchema;
  responseSchema: TResponseSchema;
}

export type ToolFn<
  TRequestSchema extends z.ZodSchema | null,
  TResponseSchema extends z.ZodSchema,
> = TRequestSchema extends z.ZodSchema
  ? (data: z.input<TRequestSchema>) => Promise<z.output<TResponseSchema>>
  : () => Promise<z.output<TResponseSchema>>;

export const baseResponseSchema = z.object({
  type: z.string(),
  id: z.string(),
  status: z.union([z.literal("ok"), z.literal("error")]),
});

export const toolFactory = <
  TName extends string,
  TRequestSchema extends z.ZodSchema | null,
  TResponseSchema extends z.ZodSchema,
>(
  toolConfig: ToolConfig<TName, TRequestSchema, TResponseSchema>,
): ToolFn<TRequestSchema, TResponseSchema> => {
  const responseName = `${toolConfig.name}${RESPONSE_SUFFIX}` as const;
  const responseSchema = z.discriminatedUnion("status", [
    z.object({
      type: z.literal(responseName),
      id: z.string(),
      status: z.literal("ok"),
      data: toolConfig.responseSchema,
    }),
    z.object({
      type: z.literal(responseName),
      id: z.string(),
      status: z.literal("error"),
      data: z.string(),
    }),
  ]);
  const exec = async (data: unknown) => {
    const validatedData = toolConfig.requestSchema
      ? toolConfig.requestSchema.parse(data)
      : undefined;
    const client = await getIpcClient();
    const id = crypto.randomUUID();
    return new Promise<z.output<TResponseSchema>>((resolve, reject) => {
      const errorHandler = (error: Error) => {
        client.removeListener("error", errorHandler);
        client.removeListener("data", responseHandler);
        reject(error);
      };

      const responseHandler = (response: Uint8Array) => {
        const resData = json.deserialize(
          pako.inflate(response, { to: "string" }),
        );
        const baseResponse = baseResponseSchema.parse(resData);
        if (baseResponse.type === responseName && baseResponse.id === id) {
          const parsedResponse = responseSchema.parse(resData);
          client.removeListener("error", errorHandler);
          client.removeListener("data", responseHandler);
          if (parsedResponse.status === "ok") resolve(parsedResponse.data);
          else reject(new Error(parsedResponse.status));
        }
      };

      client.once("error", errorHandler);
      client.on("data", responseHandler);
      client.write(
        pako.deflate(
          json.serialize({
            type: toolConfig.name,
            id,
            data: validatedData,
          }),
        ),
      );
    });
  };

  return exec as ToolFn<TRequestSchema, TResponseSchema>;
};
