import { z } from "zod";

type $Partial<T> = Partial<T>;

export declare namespace Llm {
  export type StopReason = "end" | "max_tokens" | "tool_call" | "stop_sequence";

  export type Usage = {
    inputTokens: number;
    outputTokens: number;
  };

  export type Tool = {
    name: string;
    schema: z.ZodSchema; // Todo: force object schema
  };

  export type Completion = {
    temperature: number;
    maxTokens: number;
    messages: Array<Llm.Message>;
    system?: string;
    topK?: number;
    topP?: number;
    stopSequences?: string[];
    toolsConfig?: Llm.Completion.Tool;
    usage?: Usage;
    stopReason?: StopReason;
  };

  export namespace Completion {
    export type Tool = Tool.Single | Tool.Multi;

    export namespace Tool {
      export type Type = "single" | "multi";

      export type Single = {
        type: "single";
        tool: Llm.Tool;
      };

      export type Multi = {
        type: "multi";
        tools: Array<Llm.Tool>;
        requireToolUse?: boolean;
      };
    }

    type WithResponse = Completion & {
      stopReason: StopReason;
      usage: Usage;
    };

    export namespace Response {
      export type Part = {
        stopReason: StopReason;
        usage: Usage;
      };
    }

    export type Partial = $Partial<Completion>;
  }

  export type Message = User.Message | Assistant.Message;

  export namespace Message {
    export type Role = User.Role | Assistant.Role;

    export type Content =
      | Content.Text
      | Content.Image
      | Content.ToolCall
      | Content.ToolResponse;

    export namespace Content {
      export type Text = {
        type: "text";
        text: string;
      };

      export type Image = {
        type: "image";
        image: Image.Base64;
      };

      export namespace Image {
        export type Base64 = {
          type: "base64";
          data: string;
          mimeType: string;
        };
      }

      export type ToolCall = {
        type: "tool_call";
        toolCallId: string;
        toolName: string;
        toolArgs: any;
      };

      export type ToolResponse = {
        type: "tool_response";
        toolCallId: string;
        toolOutput: any;
      };
    }
  }

  export namespace User {
    export type Role = "user";

    export type Content =
      | Message.Content.Text
      | Message.Content.Image
      | Message.Content.ToolResponse;

    export type Message = {
      role: Role;
      content: Array<Content>;
    };
  }

  export namespace Assistant {
    export type Role = "assistant";

    export type Content = Message.Content.Text | Message.Content.ToolCall;

    export type Message = {
      role: Role;
      content: Array<Content>;
    };
  }
}
