import { never } from "@shared/src/ts.utils";
import { pipe, Resolvable } from "@synstack/resolved";
// We want to avoid importing the whole library for a single type
import { type Base64Data } from "../../fs/src/file.lib";

import { t, Text, tParse } from "@synstack/text";
import { Llm } from "./llm.types";

export const userMsg = <
  T extends
    Array<MessageBuilder.User.TemplateValue> = Array<MessageBuilder.User.TemplateValue>,
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
        never(v.type);
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
    Array<MessageBuilder.Assistant.TemplateValue> = Array<MessageBuilder.Assistant.TemplateValue>,
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

export class Message<T extends Resolvable<Llm.Message>> {
  private readonly _message: T;

  private constructor(message: T) {
    this._message = message;
  }

  public static from(message: Resolvable<Llm.Message>) {
    return new Message(message);
  }

  public get message() {
    return this._message;
  }
}

export declare namespace MessageBuilder {
  export type TemplateFn<TExtraValue extends Text.ExtraObject.Base = never> = (
    template: TemplateStringsArray,
    ...values: Array<Text.TemplateValue<TExtraValue>>
  ) => void;

  export namespace Assistant {
    export type ExtraValues = Llm.Message.Content.ToolCall;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type TemplateFn = MessageBuilder.TemplateFn<ExtraValues>;
  }

  export namespace User {
    export type ExtraValues = Base64Data;

    export type TemplateValue = Text.TemplateValue<ExtraValues>;

    export type TemplateFn = MessageBuilder.TemplateFn<ExtraValues>;
  }
}
