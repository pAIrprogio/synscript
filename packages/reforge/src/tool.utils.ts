import { json } from "@synstack/json";
import * as net from "net";
import pako from "pako";
import { z } from "zod/v4";

export const RESPONSE_SUFFIX = "_RESPONSE";

const memoize = <ARGS extends Array<any>, VALUE>(
  fn: (...args: ARGS) => VALUE,
) => {
  let cache: { data: VALUE } | undefined = undefined;
  return (...args: ARGS) => {
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
  NAME extends string,
  REQUEST_SCHEMA extends z.ZodType | null,
  RESPONSE_SCHEMA extends z.ZodType = z.ZodAny,
> {
  name: NAME;
  requestSchema: REQUEST_SCHEMA;
  responseSchema: RESPONSE_SCHEMA;
}

export type ToolFn<
  REQUEST_SCHEMA extends z.ZodType | null,
  RESPONSE_SCHEMA extends z.ZodType = z.ZodTypeAny,
> = REQUEST_SCHEMA extends z.ZodType
  ? (data: z.input<REQUEST_SCHEMA>) => Promise<z.output<RESPONSE_SCHEMA>>
  : () => Promise<z.output<RESPONSE_SCHEMA>>;

export const baseResponseSchema = z.object({
  type: z.string(),
  id: z.string(),
  status: z.union([z.literal("ok"), z.literal("error")]),
});

export const toolFactory = <
  NAME extends string,
  REQUEST_SCHEMA extends z.ZodType | null,
  RESPONSE_SCHEMA extends z.ZodType = z.ZodAny,
>(
  toolConfig: ToolConfig<NAME, REQUEST_SCHEMA, RESPONSE_SCHEMA>,
): ToolFn<REQUEST_SCHEMA, RESPONSE_SCHEMA> => {
  const responseName = `${toolConfig.name}${RESPONSE_SUFFIX}` as const;
  const responseSchema = z.discriminatedUnion("status", [
    z.object({
      status: z.literal("ok"),
      type: z.literal(responseName),
      id: z.string(),
      data: toolConfig.responseSchema,
    }),
    z.object({
      status: z.literal("error"),
      type: z.literal(responseName),
      id: z.string(),
      data: z.string(),
    }),
  ]);
  const exec = async (data: unknown) => {
    const validatedData = toolConfig.requestSchema
      ? toolConfig.requestSchema.parse(data)
      : undefined;
    const client = await getIpcClient();
    const id = crypto.randomUUID();
    return new Promise<z.output<RESPONSE_SCHEMA>>((resolve, reject) => {
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
          // @ts-expect-error - TODO: fix this
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (parsedResponse.status === "ok") resolve(parsedResponse.data);
          // @ts-expect-error - TODO: fix this
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          else reject(new Error(parsedResponse.data));
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

  return exec as ToolFn<REQUEST_SCHEMA, RESPONSE_SCHEMA>;
};
