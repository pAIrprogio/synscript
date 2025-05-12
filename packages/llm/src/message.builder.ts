import { pipe } from "@synstack/resolved";
import { match, P } from "ts-pattern";

import { t, type Text, tParse } from "@synstack/text";
import { readFileSync } from "fs";
import type { Llm } from "./llm.types.ts";

function mapTextPart(v: string): Llm.Message.Part.Text {
  return { type: "text", text: v };
}

function mapImagePart(
  v: Llm.Message.Template.Part.Image,
): Llm.Message.Part.Image {
  return {
    type: "image",
    mimeType: v.mimeType,
    image: v.encoding === "path" ? readFileSync(v.data) : v.data,
  };
}

function mapFilePart(v: Llm.Message.Template.Part.File): Llm.Message.Part.File {
  return {
    type: "file",
    mimeType: v.mimeType,
    data: v.encoding === "path" ? readFileSync(v.data) : v.data,
  };
}

export function userMsg<
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
        }) satisfies Llm.Message.User,
    ).$;
}

export function assistantMsg<
  T extends
    Array<MessageTemplate.Assistant.TemplateValue> = Array<MessageTemplate.Assistant.TemplateValue>,
>(template: TemplateStringsArray, ...values: T) {
  return pipe(t(template, ...values))
    ._(tParse)
    ._((parts) =>
      parts.map(
        (v: Llm.Message.Assistant.Template.Part): Llm.Message.Assistant.Part =>
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
        }) satisfies Llm.Message.Assistant,
    ).$;
}

export function systemMsg<
  T extends
    Array<MessageTemplate.System.TemplateValue> = Array<MessageTemplate.System.TemplateValue>,
>(template: TemplateStringsArray, ...values: T) {
  return pipe(t(template, ...values))._(
    (content) =>
      ({ role: "system" as const, content }) satisfies Llm.Message.System,
  ).$;
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

export const messageToText = (message: Llm.Message) => {
  if (typeof message.content === "string") return message.content;
  return message.content.reduce((v, c) => {
    if (c.type === "text") return v + c.text;
    return v;
  }, "");
};
