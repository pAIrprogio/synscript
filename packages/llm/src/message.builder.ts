import { never } from "@shared/ts.utils";
import { pipe } from "@synstack/resolved";
// We want to avoid importing the whole library for a single type
import { type Base64Data } from "../../fs/src/file.lib";

import { t, Text, tParse } from "@synstack/text";
import { Llm } from "./llm.types";

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
