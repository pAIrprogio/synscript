import { enhance, type Enhanced } from "@synstack/enhance";
import { type Llm } from "./llm.types.ts";

// Todo: decide to delete or not

/**
 * Represents text content in an LLM message
 * Provides a type-safe wrapper for text content with value conversion methods
 * @example
 * ```typescript
 * const text = TextContent.from("Hello, world!");
 * const value = text.valueOf(); // Convert to Llm.Message.Content.Text
 * ```
 */
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

/**
 * Represents image content in an LLM message
 * Provides a type-safe wrapper for base64-encoded images with value conversion methods
 * @example
 * ```typescript
 * const image = ImageContent.from({ type: "base64", data: "...", mimeType: "image/png" });
 * const value = image.valueOf(); // Convert to Llm.Message.Content.Image
 * ```
 */
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

/**
 * Represents a tool call in an LLM message
 * Provides a type-safe wrapper for tool calls with value conversion methods
 * @example
 * ```typescript
 * const toolCall = ToolCallContent.from({ toolCallId: "123", toolName: "calculator", toolArgs: { x: 1, y: 2 } });
 * const value = toolCall.valueOf(); // Convert to Llm.Message.Content.ToolCall
 * ```
 */
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

/**
 * Represents a tool response in an LLM message
 * Provides a type-safe wrapper for tool responses with value conversion methods
 * @example
 * ```typescript
 * const response = ToolResponseContent.from({ toolCallId: "123", toolOutput: { result: 3 } });
 * const value = response.valueOf(); // Convert to Llm.Message.Content.ToolResponse
 * ```
 */
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

/**
 * Union type of all possible message content types
 * Used for type-safe message content handling
 */
type MessageContent =
  | TextContent
  | ImageContent
  | ToolCallContent
  | ToolResponseContent;

/**
 * Interface defining additional methods available on message content arrays
 */
interface ContentsMethods {
  /**
   * Filters the array to return only tool call contents
   * @returns Array of ToolCallContent objects
   */
  toolCalls(this: Array<MessageContent>): Array<ToolCallContent>;
}

const customMethods: ContentsMethods = {
  toolCalls(this: Array<MessageContent>) {
    return this.filter((c) => c.type === "tool_call");
  },
};

/**
 * Enhanced type for arrays of message contents
 * Adds utility methods for working with message content arrays
 */
type MessageContents = Enhanced<
  "contents",
  Array<MessageContent>,
  ContentsMethods
>;

/**
 * Creates an enhanced array of message contents with additional utility methods
 * @param contents - Array of message content objects (text, images, tool calls, tool responses)
 * @returns Enhanced array with additional methods like toolCalls() for filtering tool call contents
 * @example
 * ```typescript
 * const contents = MessageContents([textContent, toolCallContent]);
 * const toolCalls = contents.toolCalls(); // Get all tool calls
 * ```
 */
export const MessageContents = (
  contents: Array<MessageContent>,
): MessageContents =>
  // @ts-expect-error - Todo
  enhance("MessageContent", contents, customMethods);
