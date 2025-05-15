import { pipe } from "@synstack/resolved";
import { match, P } from "ts-pattern";

import { t, type Text, tParse } from "@synstack/text";
import { readFileSync } from "fs";
import type { Llm } from "./llm.types.ts";

/**
 * Maps a string to a text message part.
 * @param v The string content to be mapped
 * @returns A text message part object
 */
function mapTextPart(v: string): Llm.Message.Part.Text {
  return { type: "text", text: v };
}

/**
 * Maps an image template part to an image message part.
 * @param v The image template part to be mapped
 * @returns An image message part object with binary data
 */
function mapImagePart(
  v: Llm.Message.Template.Part.Image,
): Llm.Message.Part.Image {
  return {
    type: "image",
    mimeType: v.mimeType,
    image: v.encoding === "path" ? readFileSync(v.data) : v.data,
  };
}

/**
 * Maps a file template part to a file message part.
 * @param v The file template part to be mapped
 * @returns A file message part object with binary data
 */
function mapFilePart(v: Llm.Message.Template.Part.File): Llm.Message.Part.File {
  return {
    type: "file",
    mimeType: v.mimeType,
    data: v.encoding === "path" ? readFileSync(v.data) : v.data,
  };
}

/**
 * Creates a user message with custom provider options.
 *
 * @param options Configuration options for the message
 * @param options.providerOptions Provider-specific options
 * @returns A template string function that builds user messages with the specified options
 *
 * @example
 * ```ts
 * // Create a user message with custom provider options
 * const userMsgWithCache = userMsgWithOptions({
 *   providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }
 * });
 *
 * // Use the custom message builder
 * const message = userMsgWithCache`
 *   Hello, I need help with ${userQuery}.
 *   ${filePart.fromPath('data.csv')}
 * `;
 * ```
 */
export function userMsgWithOptions(options: {
  providerOptions?: Llm.Provider.Options;
}) {
  return function userMsg<
    T extends
      Array<MessageTemplate.User.TemplateValue> = Array<MessageTemplate.User.TemplateValue>,
  >(template: TemplateStringsArray, ...values: T) {
    return pipe(t(template, ...values))
      ._(tParse)
      ._((parts) =>
        parts.map(
          (v: Llm.Message.User.Template.Part): Llm.Message.User.Part =>
            match(v)
              .with(P.string, mapTextPart)
              .with({ type: "image" }, mapImagePart)
              .with({ type: "file" }, mapFilePart)
              .exhaustive(),
        ),
      )
      ._(
        (content) =>
          ({
            role: "user" as const,
            content,
            providerOptions: options.providerOptions,
          }) satisfies Llm.Message.User,
      ).$;
  };
}

/**
 * AI SDK compatible user message builder. Creates a user message with text, images, and files.
 *
 * @returns A user message object compatible with AI SDK
 *
 * @example
 * ```ts
 * // Simple text message
 * const textMessage = userMsg`
 *   Please analyze this information.
 * `;
 *
 * // Message with image
 * const imageMessage = userMsg`
 *   What's in this image?
 *   ${filePart.fromPath('image.png')}
 * `;
 *
 * // Message with file
 * const fileMessage = userMsg`
 *   Transcribe this audio:
 *   ${filePart.fromPath('audio.mp3')}
 * `;
 *
 * // Message with variable
 * const name = "Alice";
 * const greetingMessage = userMsg`
 *   Hello, my name is ${name}. Can you help me?
 * `;
 * ```
 */
export function userMsg<
  T extends
    Array<MessageTemplate.User.TemplateValue> = Array<MessageTemplate.User.TemplateValue>,
>(template: TemplateStringsArray, ...values: T) {
  return userMsgWithOptions({})(template, ...values);
}

/**
 * User message builder with cache control pre-configured.
 *
 * Supported providers:
 * - Anthropic (Vertex, Anthropic, AIStudio) using [ephemeral cache](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic#cache-control)
 * - Bedrock using [cachePoints](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#cache-points)
 *
 * @returns A user message object with cache control settings
 *
 * @example
 * ```ts
 * // Create a cached user message
 * const cachedMessage = userMsg.cached`
 *   I need information about ${topic}.
 * `;
 *
 * // Cached message with image
 * const cachedImageMessage = userMsg.cached`
 *   What's in this image?
 *   ${filePart.fromPath('image.png')}
 * `;
 * ```
 */
userMsg.cached = userMsgWithOptions({
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } },
    bedrock: { cachePoint: { type: "default" } },
  },
});

/**
 * Creates an assistant message builder with custom provider options.
 *
 * @param options Configuration options for the message
 * @param options.providerOptions Provider-specific options
 * @returns A template string function that builds assistant messages with the specified options
 *
 * @example
 * ```ts
 * // Create an assistant message with custom provider options
 * const assistantMsgWithCache = assistantMsgWithOptions({
 *   providerOptions: { openai: { cacheControl: { type: "ephemeral" } } }
 * });
 *
 * // Use the custom message builder
 * const message = assistantMsgWithCache`
 *   Based on my analysis, the answer is 42.
 *   ${toolCallPart}
 * `;
 * ```
 */
export function assistantMsgWithOptions(options: {
  providerOptions?: Llm.Provider.Options;
}) {
  return function assistantMsg<
    T extends
      Array<MessageTemplate.Assistant.TemplateValue> = Array<MessageTemplate.Assistant.TemplateValue>,
  >(template: TemplateStringsArray, ...values: T) {
    return pipe(t(template, ...values))
      ._(tParse)
      ._((parts) =>
        parts.map(
          (
            v: Llm.Message.Assistant.Template.Part,
          ): Llm.Message.Assistant.Part =>
            match(v)
              .with(P.string, mapTextPart)
              .with({ type: "tool-call" }, (v) => v)
              .exhaustive(),
        ),
      )
      ._(
        (content) =>
          ({
            role: "assistant" as const,
            content,
            providerOptions: options.providerOptions,
          }) satisfies Llm.Message.Assistant,
      ).$;
  };
}

/**
 * AI SDK compatible assistant message builder. Creates an assistant message with text and tool calls.
 *
 * @param template Template string
 * @param values Template values, can include text or tool calls
 * @returns An assistant message object compatible with AI SDK
 *
 * @example
 * ```ts
 * // Simple text message
 * const simpleMessage = assistantMsg`
 *   I've analyzed the data and found three key insights.
 * `;
 *
 * // Message with tool call
 * const toolCallMessage = assistantMsg`
 *   Let me search for that information.
 *   ${toolCall('search', { query: 'weather forecast' })}
 * `;
 *
 * // Message with variable
 * const result = "42";
 * const resultMessage = assistantMsg`
 *   After calculation, I found that the answer is ${result}.
 * `;
 * ```
 */
export function assistantMsg<
  T extends
    Array<MessageTemplate.Assistant.TemplateValue> = Array<MessageTemplate.Assistant.TemplateValue>,
>(template: TemplateStringsArray, ...values: T) {
  return assistantMsgWithOptions({})(template, ...values);
}

/**
 * Creates a system message builder with custom provider options.
 *
 * @param options Configuration options for the message
 * @param options.providerOptions Provider-specific options
 * @returns A function that builds system messages with the specified options
 *
 * @example
 * ```ts
 * // Create a system message with custom provider options
 * const customSystemMsg = systemMsgWithOptions({
 *   providerOptions: { anthropic: { system_prompt_behavior: "default" } }
 * });
 *
 * // Use the custom message builder
 * const message = customSystemMsg`
 *   You are a helpful AI assistant with expertise in ${expertise}.
 * `;
 * ```
 */
export function systemMsgWithOptions(options: {
  providerOptions?: Llm.Provider.Options;
}) {
  return function systemMsg<
    T extends
      Array<MessageTemplate.System.TemplateValue> = Array<MessageTemplate.System.TemplateValue>,
  >(template: TemplateStringsArray, ...values: T) {
    return pipe(t(template, ...values))._(
      (content) =>
        ({
          role: "system" as const,
          content,
          providerOptions: options.providerOptions,
        }) satisfies Llm.Message.System,
    ).$;
  };
}

/**
 * Creates a system message.
 *
 * @param template Template string array
 * @param values Values to interpolate into the template
 * @returns A system message object
 *
 * @example
 * ```ts
 * const message = systemMsg`
 *   You are a helpful AI assistant with expertise in ${expertise}.
 * `;
 * ```
 */
export function systemMsg<
  T extends
    Array<MessageTemplate.System.TemplateValue> = Array<MessageTemplate.System.TemplateValue>,
>(template: TemplateStringsArray, ...values: T) {
  return systemMsgWithOptions({})(template, ...values);
}

export declare namespace MessageTemplate {
  export type Fn<TExtraValue extends Text.ExtraObject.Base = never> = (
    template: TemplateStringsArray,
    ...values: Array<Text.TemplateValue<TExtraValue>>
  ) => void;

  export namespace System {
    export type ExtraValues = never;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type Fn = MessageTemplate.Fn<ExtraValues>;
  }

  export namespace Assistant {
    export type ExtraValues = Llm.Message.Part.ToolCall;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type Fn = MessageTemplate.Fn<ExtraValues>;
  }

  export namespace User {
    export type ExtraValues =
      | Llm.Message.Template.Part.Image
      | Llm.Message.Template.Part.File;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type Fn = MessageTemplate.Fn<ExtraValues>;
  }
}

/**
 * Converts an LLM message to plain text by concatenating all text parts.
 * Non-text parts (images, files, tool calls) are omitted.
 *
 * @param message The LLM message to convert to text
 * @returns Plain text representation of the message
 *
 * @example
 * ```ts
 * // Convert a user message to text
 * const userMsg1 = userMsg`
 *   Hello, can you help me with this image?
 *   ${filePart.fromPath('image.png')}
 * `;
 * const textOnly = messageToText(userMsg1);
 * // => "Hello, can you help me with this image?"
 *
 * // Convert an assistant message to text
 * const assistantMsg1 = assistantMsg`
 *   I see a cat in the image.
 * `;
 * const assistantTextOnly = messageToText(assistantMsg1);
 * // => "I see a cat in the image."
 * ```
 */
export const messageToText = (message: Llm.Message) => {
  if (typeof message.content === "string") return message.content;
  return message.content.reduce((v, c) => {
    if (c.type === "text") return v + c.text;
    return v;
  }, "");
};
