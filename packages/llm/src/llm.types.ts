import { type AnyZodObject, z, ZodSchema } from "zod";
import { type OneToN } from "../../shared/src/ts.utils.ts";

type $Partial<T> = Partial<T>;

export declare namespace Llm {
  export type Tool<
    TName extends string = string,
    TSchema extends ZodSchema = AnyZodObject,
  > = {
    name: TName;
    schema: TSchema; // Todo: force object schema
  };

  export type Completion = {
    temperature: number;
    maxTokens: number;
    messages: Array<Llm.Message>;
    system?: string;
    topK?: number;
    topP?: number;
    stopSequences?: string[];
    toolsConfig?: Llm.Completion.ToolConfig;
    usage?: Completion.Usage;
    stopReason?: Completion.StopReason;
  };

  export namespace Completion {
    export type StopReason =
      | "end"
      | "max_tokens"
      | "tool_call"
      | "stop_sequence";

    export type Usage = {
      inputTokens: number;
      outputTokens: number;
    };

    export type ToolConfig = ToolConfig.Single | ToolConfig.Multi;

    export namespace ToolConfig {
      export type Type = "single" | "multi";

      export type Single<TTool extends Llm.Tool = Llm.Tool> = {
        type: "single";
        tool: TTool;
      };

      export type Multi<
        TTools extends Array<Llm.Tool> = Array<Llm.Tool>,
        TRequire extends boolean = boolean,
      > = {
        type: "multi";
        tools: TTools;
        requireToolUse: TRequire;
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

      export type ToolCall<TTool extends Llm.Tool = Llm.Tool> = {
        type: "tool_call";
        toolCallId: string;
        toolName: TTool["name"];
        toolArgs: z.output<TTool["schema"]>;
      };

      export namespace ToolCall {
        export type ResponseFromToolConfig<
          TConfig extends Completion.ToolConfig,
        > = TConfig extends Completion.ToolConfig.Single
          ? [ToolCall<TConfig["tool"]>]
          : // Remap each Tool to a ToolCall and transform to union
            TConfig extends Completion.ToolConfig.Multi
            ? TConfig["requireToolUse"] extends true
              ? OneToN<
                  {
                    // infer is used to extract each type specifically instead of a union of types
                    [K in keyof TConfig["tools"]]: TConfig["tools"][K] extends infer U
                      ? U extends Tool
                        ? ToolCall<U>
                        : never
                      : never;
                  }[number]
                >
              : Array<
                  {
                    // infer is used to extract each type specifically instead of a union of types
                    [K in keyof TConfig["tools"]]: TConfig["tools"][K] extends infer U
                      ? U extends Tool
                        ? ToolCall<U>
                        : never
                      : never;
                  }[number]
                >
            : Array<ToolCall>;
      }

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
