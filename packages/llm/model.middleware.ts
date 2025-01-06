import { experimental_wrapLanguageModel } from "ai";
import type { Llm } from "./src/llm.types.ts";
import { messageToText } from "./src/message.builder.ts";

/**
 * Wraps the model to add the provided last assistant message to the output
 */
export const includeAssistantMessage = (model: Llm.Model) =>
  experimental_wrapLanguageModel({
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
          new TransformStream<
            Llm.Completion.Stream.Text.Part,
            Llm.Completion.Stream.Text.Part
          >({
            start(controller) {
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
