import { pipe } from "@synstack/resolved";
import { never } from "../../shared/src/ts.utils.ts";
// We want to avoid importing the whole library for a single type
import { type Base64Data } from "../../fs/src/file.lib.ts";

import { t, type Text, tParse } from "@synstack/text";
import { type Llm } from "./llm.types.ts";

/**
 * Creates a user message with support for text, images, and tool responses
 * @param template - Template string containing the message content
 * @param values - Values to interpolate into the template (text, base64 images, tool responses)
 * @returns A strongly-typed user message object conforming to Llm.User.Message
 * @example
 * ```typescript
 * const msg = userMsg`Hello, here's an image: ${base64Image}`;
 * const msg2 = userMsg`Tool response: ${toolResponse}`;
 * ```
 */
export const userMsg = <
  T extends
    Array<MessageTemplate.User.TemplateValue> = Array<MessageTemplate.User.TemplateValue>,
>(
  template: TemplateStringsArray,
  ...values: T
) =>
  pipe(t(template, ...values))
    ._(tParse)
    ._((parts) =>
      parts.map((v) => {
        if (typeof v === "string")
          return { type: "text", text: v } satisfies Llm.Message.Content.Text;
        if (v.type === "base64")
          return {
            type: "image",
            image: v,
          } satisfies Llm.Message.Content.Image;
        if (v.type === "tool_response") return v;
        never(v);
      }),
    )
    ._(
      (content) =>
        ({
          role: "user" as const,
          content,
        }) as Llm.User.Message,
    ).$;

/**
 * Creates an assistant message with support for text and tool calls
 * @param template - Template string containing the message content
 * @param values - Values to interpolate into the template (text, tool calls)
 * @returns A strongly-typed assistant message object conforming to Llm.Assistant.Message
 * @example
 * ```typescript
 * const msg = assistantMsg`Let me help you with that ${toolCall}`;
 * ```
 */
export const assistantMsg = <
  T extends
    Array<MessageTemplate.Assistant.TemplateValue> = Array<MessageTemplate.Assistant.TemplateValue>,
>(
  template: TemplateStringsArray,
  ...values: T
) => {
  return pipe(t(template, ...values))
    ._(tParse)
    ._((parts) =>
      parts.map((v) => {
        if (typeof v === "string")
          return { type: "text", text: v } satisfies Llm.Message.Content.Text;
        if (v.type === "tool_call") return v;
        never(v.type);
      }),
    )
    ._(
      (content) =>
        ({
          role: "assistant" as const,
          content,
        }) as Llm.Assistant.Message,
    ).$;
};

export declare namespace MessageTemplate {
  export type Fn<TExtraValue extends Text.ExtraObject.Base = never> = (
    template: TemplateStringsArray,
    ...values: Array<Text.TemplateValue<TExtraValue>>
  ) => void;

  export namespace Assistant {
    export type ExtraValues = Llm.Message.Content.ToolCall;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type Fn = MessageTemplate.Fn<ExtraValues>;
  }

  export namespace User {
    export type ExtraValues = Base64Data | Llm.Message.Content.ToolResponse;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type Fn = MessageTemplate.Fn<ExtraValues>;
  }
}
