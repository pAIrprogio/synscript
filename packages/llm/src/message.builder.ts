import { pipe } from "@synstack/resolved";
import { never } from "../../shared/src/ts.utils.ts";

import { t, type Text, tParse } from "@synstack/text";
import { readFileSync } from "fs";
import type { Llm } from "./llm.types.ts";

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
          return { type: "text", text: v } satisfies Llm.Message.Part.Text;
        if (v.type === "image") {
          return {
            type: "image",
            mimeType: v.mimeType,
            image: v.encoding === "path" ? readFileSync(v.data) : v.data,
          } satisfies Llm.Message.Part.Image;
        }
        if (v.type === "file") {
          return {
            type: "file",
            mimeType: v.mimeType,
            data: v.encoding === "path" ? readFileSync(v.data) : v.data,
          } satisfies Llm.Message.Part.File;
        }
        never(v);
      }),
    )
    ._(
      (content) =>
        ({
          role: "user" as const,
          content,
        }) satisfies Llm.Message.User,
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
          return { type: "text", text: v } satisfies Llm.Message.Part.Text;
        if (v.type === "tool-call") return v;
        never(v.type);
      }),
    )
    ._(
      (content) =>
        ({
          role: "assistant" as const,
          content,
        }) satisfies Llm.Message.Assistant,
    ).$;
};

export const systemMsg = <
  T extends
    Array<MessageTemplate.System.TemplateValue> = Array<MessageTemplate.System.TemplateValue>,
>(
  template: TemplateStringsArray,
  ...values: T
) => {
  return pipe(t(template, ...values))._(
    (content) =>
      ({ role: "system" as const, content }) satisfies Llm.Message.System,
  ).$;
};

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
