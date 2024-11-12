import { json } from "@synstack/json";
import * as net from "net";
import { z } from "zod";

// Todo: externalize memoization

const memoize = <TArgs extends Array<any>, TValue>(
  fn: (...args: TArgs) => TValue,
) => {
  let cache: { data: TValue } | undefined = undefined;
  return (...args: TArgs) => {
    if (cache === undefined) cache = { data: fn(...args) };
    return cache.data;
  };
};

const getIpcClient = memoize(() => {
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

export const RESPONSE_SUFFIX = "_RESPONSE";

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

      const responseHandler = (response: string) => {
        const resData = json.deserialize(response);
        const parsedResponse = responseSchema.parse(resData);
        if (parsedResponse.type === responseName && parsedResponse.id === id) {
          client.removeListener("error", errorHandler);
          client.removeListener("data", responseHandler);
          if (parsedResponse.status === "ok") resolve(parsedResponse.data);
          else reject(new Error(parsedResponse.status));
        }
      };

      client.once("error", errorHandler);
      client.on("data", responseHandler);
      client.write(
        json.serialize({
          type: toolConfig.name,
          id,
          data: validatedData,
        }),
      );
    });
  };

  return exec as ToolFn<TRequestSchema, TResponseSchema>;
};

export const getTargetFileConfig = {
  name: "GET_TARGET_FILE",
  requestSchema: null,
  responseSchema: z.string().nullable(),
} as const;

export const getTargetFile = toolFactory(getTargetFileConfig);

export const getOpenedFilesConfig = {
  name: "GET_OPENED_FILES",
  requestSchema: null,
  responseSchema: z.array(z.string()),
} as const;

export const getOpenedFiles = toolFactory(getOpenedFilesConfig);

export const promptSelectConfig = {
  name: "PROMPT_SELECT",
  requestSchema: z.object({
    title: z.string().optional(),
    options: z.array(z.string()),
    placeHolder: z.string().optional(),
  }),
  responseSchema: z.string().nullable(),
} as const;

export const promptSelect = toolFactory(promptSelectConfig);

export const promptInputConfig = {
  name: "PROMPT_INPUT",
  requestSchema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    placeHolder: z.string().optional(),
    defaultValue: z.string().optional(),
    isPassword: z.boolean().optional().default(false),
  }),
  responseSchema: z.string().nullable(),
} as const;

export const promptInput = toolFactory(promptInputConfig);

export const promptMultiSelectConfig = {
  name: "PROMPT_MULTI_SELECT",
  requestSchema: z.object({
    title: z.string().optional(),
    options: z.array(z.string()),
    placeHolder: z.string().optional(),
  }),
  responseSchema: z.array(z.string()),
} as const;

export const promptMultiSelect = toolFactory(promptMultiSelectConfig);

export const notifyConfig = {
  name: "NOTIFY",
  requestSchema: z.object({
    title: z.string().optional(),
    message: z.string(),
    type: z.enum(["info", "warning", "error"]).optional().default("info"),
    buttons: z.array(z.string()).optional(),
  }),
  responseSchema: z.string().nullable(),
} as const;

export const notify = toolFactory(notifyConfig);

export const openFileConfig = {
  name: "OPEN_FILE",
  requestSchema: z.object({
    path: z.string(),
    config: z
      .object({
        force: z.boolean().default(false),
        preview: z.boolean().optional().default(false),
        column: z
          .union([z.enum(["active", "beside"]), z.number().min(1).max(9)])
          .optional(),
      })
      .default({
        column: "active",
      }),
  }),
  responseSchema: z.object({
    path: z.string(),
    isAlreadyOpened: z.boolean(),
  }),
};

export const openFile = toolFactory(openFileConfig);

export const openFilesConfig = {
  name: "OPEN_FILES",
  requestSchema: z.object({
    paths: z.array(z.string()),
    config: z
      .object({
        force: z.boolean().optional().default(false),
        preview: z.boolean().optional().default(false),
        column: z
          .union([z.enum(["active", "beside"]), z.number().min(1).max(9)])
          .optional(),
      })
      .default({
        column: "active",
      }),
  }),
  responseSchema: z.array(
    z.object({ path: z.string(), isAlreadyOpened: z.boolean() }),
  ),
};

export const openFiles = toolFactory(openFilesConfig);

export const getTargetSelectionsConfig = {
  name: "GET_SELECTION",
  requestSchema: null,
  responseSchema: z
    .object({
      path: z.string(),
      selections: z.array(
        z.object({ start: z.number(), end: z.number(), content: z.string() }),
      ),
    })
    .nullable(),
};

export const getTargetSelections = toolFactory(getTargetSelectionsConfig);

export const executeCommandConfig = {
  name: "EXECUTE_COMMAND",
  requestSchema: z.object({
    command: z.string(),
    /**
     * List of args to be passed to the command
     */
    args: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            /**
             * Transforms the value provided in `path` into a valid Uri instance
             */
            type: z.literal("path"),
            /**
             * The absolute path to the file
             */
            value: z.string(),
          }),
          z.object({
            /**
             * Any other value that to pass to the command
             */
            type: z.literal("primitive"),
            value: z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.record(z.any()),
              z.array(z.any()),
            ]),
          }),
        ]),
      )
      .optional()
      .default([]),
  }),
  responseSchema: z.any().optional(),
};

export const executeCommand = toolFactory(executeCommandConfig);
