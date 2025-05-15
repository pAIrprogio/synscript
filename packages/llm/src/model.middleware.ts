import type { FsCache } from "@synstack/fs-cache";
import { wrapLanguageModel } from "ai";
import type { Llm } from "./llm.types.ts";
import { messageToText } from "./message.builder.ts";

/**
 * Wraps the model to add the provided last assistant message to the output
 *
 * By default, the last assistant message is not included in the output.
 * This middleware is useful when you want to restrict the start of the assistant's response.
 *
 * @example
 * ```ts
 * import { userMsg, assistantMsg } from "@synstack/llm";
 * import { includeAssistantMessage } from "@synstack/llm/middleware";
 * import { baseCompletion } from "../runtime/completion.runtime.ts";
 *
 * const output = baseCompletion
 *  .middlewares([includeAssistantMessage])
 *  .messages([
 *    userMsg`Write me the code for a function that returns the sum of two numbers.`,
 *    assistantMsg`
 *      \`\`\`ts
 *      function sum(a, b) {
 *    `,
 *  ])
 *  .generateText();
 * ```
 */
export const includeAssistantMessage = (model: Llm.Model) =>
  wrapLanguageModel({
    model,
    middleware: {
      wrapGenerate: async ({ doGenerate, params }) => {
        const lastMessage = params.prompt.at(-1);

        const result = await doGenerate();

        if (lastMessage?.role === "assistant") {
          return {
            ...result,
            text: messageToText(lastMessage) + (result.text ?? ""),
          };
        }

        return result;
      },

      wrapStream: async ({ doStream, params }) => {
        const lastMessage = params.prompt.at(-1);
        const result = await doStream();

        if (lastMessage?.role !== "assistant") {
          return result;
        }

        const outputStream = result.stream.pipeThrough(
          new TransformStream<Llm.Model.Stream.Part, Llm.Model.Stream.Part>({
            start(controller) {
              // Todo: include tool calls
              controller.enqueue({
                type: "text-delta",
                textDelta: messageToText(lastMessage),
              });
            },
          }),
        );

        return {
          rawCall: result.rawCall,
          rawResponse: result.rawResponse,
          request: result.request,
          warnings: result.warnings,
          stream: outputStream,
        };
      },
    },
  });

/**
 * Caches the results of the model using a cache engine instance.
 * - Uses the entire prompt as the cache to check for cache hit.
 * - Allows caching responses for the same prompt locally.
 *
 * @example
 * ```ts
 * import { fsCache } from "@synstack/fs-cache";
 * import { completion } from "@synstack/llm";
 * import { cacheCalls } from "@synstack/llm/middleware";
 * import { baseCompletion } from "../runtime/completion.runtime.ts";
 *
 * const cache = fsCache(dir("./cache"));
 *
 * // This will re-execute if any part of the prompt changed
 * // Cache will be located in ./cache/my-prompt-name.json
 * const cachedOutput = baseCompletion
 *  .prependMiddlewares([cacheCalls(cache.key(["my-prompt-name"]))])
 *  .generateText();
 * ```
 */
export const cacheCalls =
  (cache: FsCache<FsCache.Options<[Llm.Model.Generate.Options]>>) =>
  (model: Llm.Model) => {
    return wrapLanguageModel({
      model,
      middleware: {
        wrapGenerate: async ({ doGenerate, params }) => {
          const [hit, value] = await cache.get([params]);
          if (hit === "hit") {
            return value;
          }
          const res = await doGenerate();
          await cache.set([params], res);
          return res;
        },

        wrapStream: async ({ doStream, params }) => {
          const [hit, value] = await cache.get([params]);

          if (hit === "hit") {
            // We simulate the stream by emitting the parts one by one
            let index = 0;
            return {
              ...value,
              stream: new ReadableStream({
                pull(controller) {
                  if (index < value.stream.length) {
                    controller.enqueue(value.stream[index]);
                    index++;
                  } else {
                    controller.close();
                  }
                },
              }),
            } satisfies Llm.Model.Stream.Return;
          }

          // We need to collect the parts and then set the cache
          const res = await doStream();
          const collector: Array<Llm.Model.Stream.Part> = [];
          res.stream.pipeThrough(
            new TransformStream<Llm.Model.Stream.Part, Llm.Model.Stream.Part>({
              transform(chunk, controller) {
                collector.push(chunk);
                controller.enqueue(chunk);
              },
            }),
          );
          await cache.set([params], {
            ...res,
            stream: collector,
          });
          return res;
        },
      },
    });
  };
