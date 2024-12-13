import { type AnyZodObject, z, ZodSchema } from "zod";
import { type OneToN } from "../../shared/src/ts.utils.ts";

type $Partial<T> = Partial<T>;

/**
 * Core namespace for LLM (Large Language Model) interactions
 * Contains types for messages, completions, and tools
 */
export declare namespace Llm {
  /**
   * Represents a tool that can be used by the LLM
   * @template TName - The name of the tool
   * @template TSchema - The Zod schema defining the tool's input parameters
   */
  export type Tool<
    TName extends string = string,
    TSchema extends ZodSchema = AnyZodObject,
  > = {
    name: TName;
    schema: TSchema; // Todo: force object schema
  };

  /**
   * Configuration for an LLM completion request
   * @property temperature - Controls randomness in the model's output (0-1)
   * @property maxTokens - Maximum number of tokens to generate
   * @property messages - Array of messages in the conversation
   * @property system - Optional system message to set context
   * @property topK - Optional parameter for top-k sampling
   * @property topP - Optional parameter for nucleus sampling
   * @property stopSequences - Optional array of sequences that will stop generation
   * @property toolsConfig - Optional configuration for tool usage
   * @property usage - Optional token usage statistics
   * @property stopReason - Optional reason why generation stopped
   */
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

  /**
   * Represents a message in the LLM conversation
   * Can be either a user message or an assistant message
   */
  export type Message = User.Message | Assistant.Message;

  export namespace Message {
    /**
     * Role of the message sender
     * Can be either "user" or "assistant"
     */
    export type Role = User.Role | Assistant.Role;

    /**
     * Content that can be included in a message
     * Includes text, images, tool calls, and tool responses
     */
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

  /**
   * Namespace for user-specific message types and content
   */
  export namespace User {
    export type Role = "user";

    /**
     * Content types that can be included in a user message
     * Supports text, images, and tool responses
     */
    export type Content =
      | Message.Content.Text
      | Message.Content.Image
      | Message.Content.ToolResponse;

    /**
     * Represents a message from the user
     * @property role - Always "user"
     * @property content - Array of content elements (text, images, tool responses)
     */
    export type Message = {
      role: Role;
      content: Array<Content>;
    };
  }

  /**
   * Namespace for assistant-specific message types and content
   */
  export namespace Assistant {
    export type Role = "assistant";

    /**
     * Content types that can be included in an assistant message
     * Supports text and tool calls
     */
    export type Content = Message.Content.Text | Message.Content.ToolCall;

    /**
     * Represents a message from the assistant
     * @property role - Always "assistant"
     * @property content - Array of content elements (text, tool calls)
     */
    export type Message = {
      role: Role;
      content: Array<Content>;
    };
  }
}
