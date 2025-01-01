import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreSystemMessage,
  CoreTool,
  CoreToolChoice,
  CoreToolMessage,
  CoreUserMessage,
  FilePart,
  ImagePart,
  LanguageModel,
  TextPart,
  ToolCallPart,
} from "ai";
import { z } from "zod";

export declare namespace Llm {
  export type Model = LanguageModel;

  export type Message = CoreMessage;

  export namespace Message {
    export type System = CoreSystemMessage;
    export type User = CoreUserMessage;
    export type Assistant = CoreAssistantMessage;
    export type ToolResult = CoreToolMessage;

    export namespace Part {
      export type Text = TextPart;
      export type Image = ImagePart;
      export type File = FilePart;
      export type ToolCall = ToolCallPart;
      export type User = TextPart | ImagePart | FilePart;
      export type Assistant = TextPart | ToolCall;
    }
  }

  export type Tool<
    PARAMETERS extends z.ZodTypeAny = any,
    RESULT = any,
  > = CoreTool<PARAMETERS, RESULT>;

  export type Tools<
    Key extends string = string,
    Tool extends Llm.Tool = Llm.Tool,
  > = Record<Key, Tool>;

  export type ToolChoice<Tools extends Record<string, CoreTool>> =
    CoreToolChoice<Tools>;
}
