import { enhance, type Enhanced } from "@synstack/enhance";
import { type Llm } from "./llm.types.ts";

// Todo: decide to delete or not

export class TextContent {
  constructor(public readonly _text: string) {}

  public static from(text: string) {
    return new TextContent(text);
  }

  public get type() {
    return "text" as const;
  }

  public get text() {
    return this._text;
  }

  public toString() {
    return this._text;
  }

  public valueOf(): Llm.Message.Content.Text {
    return {
      type: this.type,
      text: this._text,
    };
  }
}

export class ImageContent {
  constructor(public readonly _image: Llm.Message.Content.Image.Base64) {}

  public static from(image: Llm.Message.Content.Image.Base64) {
    return new ImageContent(image);
  }

  public get type() {
    return "image" as const;
  }

  public get image() {
    return this._image;
  }

  public valueOf(): Llm.Message.Content.Image {
    return {
      type: this.type,
      image: this._image,
    };
  }
}

export class ToolCallContent {
  constructor(public readonly _toolCall: Llm.Message.Content.ToolCall) {}

  public static from(toolCall: Llm.Message.Content.ToolCall) {
    return new ToolCallContent(toolCall);
  }

  public get type() {
    return "tool_call" as const;
  }

  public get toolCall() {
    return this._toolCall;
  }

  public valueOf(): Llm.Message.Content.ToolCall {
    return this._toolCall;
  }
}

export class ToolResponseContent {
  constructor(
    public readonly _toolResponse: Omit<
      Llm.Message.Content.ToolResponse,
      "type"
    >,
  ) {}

  public static from(
    toolResponse: Omit<Llm.Message.Content.ToolResponse, "type">,
  ) {
    return new ToolResponseContent(toolResponse);
  }

  public get type() {
    return "tool_response" as const;
  }

  public get toolResponse() {
    return this._toolResponse;
  }

  public valueOf(): Llm.Message.Content.ToolResponse {
    return {
      ...this._toolResponse,
      type: this.type,
    };
    // Todo: add toolOutput
  }
}

type MessageContent =
  | TextContent
  | ImageContent
  | ToolCallContent
  | ToolResponseContent;

interface ContentsMethods {
  toolCalls(this: Array<MessageContent>): Array<ToolCallContent>;
}

const customMethods: ContentsMethods = {
  toolCalls(this: Array<MessageContent>) {
    return this.filter((c) => c.type === "tool_call");
  },
};

type MessageContents = Enhanced<
  "contents",
  Array<MessageContent>,
  ContentsMethods
>;

export const MessageContents = (
  contents: Array<MessageContent>,
): MessageContents =>
  // @ts-expect-error - Todo
  enhance("MessageContent", contents, customMethods);
