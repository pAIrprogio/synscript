import { type Resolvable } from "@synstack/resolved";
import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreSystemMessage,
  Tool as CoreTool,
  ToolChoice as CoreToolChoice,
  CoreToolMessage,
  CoreUserMessage,
  FilePart,
  GenerateObjectResult,
  GenerateTextResult,
  ImagePart,
  LanguageModel,
  LanguageModelV1StreamPart,
  ProviderMetadata,
  StepResult,
  StreamObjectResult,
  StreamTextResult,
  TextPart,
  ToolCallPart,
  ToolCallRepairFunction,
} from "ai";
import type { ZodTypeAny } from "zod";

type $Partial<T> = Partial<T>;

export declare namespace Llm {
  /**
   * Language model that is used by the AI SDK Core functions.
   */
  export type Model = LanguageModel;

  export namespace Model {
    /**
     * Experimental middleware for LanguageModelV1.
     * This type defines the structure for middleware that can be used to modify
     * the behavior of LanguageModelV1 operations.
     */
    export type Middleware = (model: Llm.Model) => Llm.Model;

    export namespace Generate {
      export type Options = Parameters<LanguageModel["doGenerate"]>[0];
      export type Return = ReturnType<LanguageModel["doGenerate"]>;
    }

    export namespace Stream {
      export type Options = Parameters<LanguageModel["doStream"]>[0];
      export type Part = LanguageModelV1StreamPart;
      export type Return = ReturnType<LanguageModel["doStream"]>;
    }
  }

  /**
   * A message that can be used in the `messages` field of a prompt.
   * It can be a user message, an assistant message, or a tool message.
   */
  export type Message = CoreMessage;

  export namespace Message {
    /**
     * Serializable message parts.
     * Used for message templating with `userMsg` and `assistantMsg`.
     */
    export namespace Template {
      export type Part = any;
      export namespace Part {
        export type Image = Image.Base64 | Image.Path | Image.Url;

        export namespace Image {
          export type Base64 = {
            type: "image";
            encoding: "base64";
            mimeType: string;
            data: string;
          };
          export type Path = {
            type: "image";
            encoding: "path";
            mimeType: string;
            data: string;
          };
          export type Url = {
            type: "image";
            encoding: "url";
            mimeType: string;
            data: string;
          };
        }

        export type File = File.Base64 | File.Path | File.Url;
        export namespace File {
          export type Base64 = {
            type: "file";
            encoding: "base64";
            mimeType: string;
            data: string;
          };
          export type Path = {
            type: "file";
            encoding: "path";
            mimeType: string;
            data: string;
          };
          export type Url = {
            type: "file";
            encoding: "url";
            mimeType: string;
            data: string;
          };
        }
      }
    }

    /**
     * A system message. It can contain system information.
     *
     * Note: using the "system" part of the prompt is strongly preferred
     * to increase the resilience against prompt injection attacks,
     * and because not all providers support several system messages.
     */
    export type System = CoreSystemMessage;

    export namespace User {
      /**
       * A user message where content is always an array of parts.
       */
      export type Serializable = {
        role: "user";
        content: Array<Llm.Message.User.Part>;
        experimental_providerMetadata?: Llm.Provider.Metadata;
      };

      /**
       * Content parts of a user message.
       */
      export type Part =
        | Llm.Message.Part.Text
        | Llm.Message.Part.Image
        | Llm.Message.Part.File;

      export namespace Template {
        export type Part =
          | string
          | Llm.Message.Template.Part.File
          | Llm.Message.Template.Part.Image;
      }
    }

    /**
     * A user message. It can contain text or a combination of text and images.
     */
    export type User = CoreUserMessage;

    /**
     * An assistant message. It can contain text, tool calls, or a combination of text and tool calls.
     */
    export type Assistant = CoreAssistantMessage;

    export namespace Assistant {
      /**
       * An assistant message where content is always an array of parts.
       */
      export type Serializable = {
        role: "assistant";
        content: Array<Llm.Message.Assistant.Part>;
        experimental_providerMetadata?: ProviderMetadata;
      };

      export namespace Template {
        export type Part = string | Llm.Message.Part.ToolCall;
      }

      /**
       * Content parts of an assistant message.
       */
      export type Part = Llm.Message.Part.Text | Llm.Message.Part.ToolCall;
    }

    /**
     * A tool message. It contains the result of one or more tool calls.
     */
    export type ToolResult = CoreToolMessage;

    /**
     * Content parts of a message in a prompt.
     */
    export namespace Part {
      /**
       * Text content part of a prompt. It contains a string of text.
       */
      export type Text = TextPart;
      /**
       * Image content part of a prompt. It contains an image.
       */
      export type Image = ImagePart;
      /**
       * File content part of a prompt. It contains a file.
       */
      export type File = FilePart;
      /**
       * Tool call content part of a prompt. It contains a tool call (usually generated by the AI model).
       */
      export type ToolCall = ToolCallPart;
    }
  }

  export type Completion = {
    // #region Model
    /**
     * The language model to use.
     */
    model: Llm.Model;

    /**
     * Middlewares to wrap the model with
     *
     * Will be executed from first to last:
     * ```ts
     * completion.middlewares([middleware1, middleware2]) // middleware2(middleware1(model))
     * ```
     */
    middlewares?: Array<Llm.Model.Middleware>;
    // #endregion

    /**
     * The messages to use in the prompt.
     */
    messages: Resolvable<Array<Llm.Message>>;

    // #region LLM
    /**
     * Maximum number of tokens to generate.
     */
    maxTokens?: number;

    /**
     * Temperature setting.
     * The value is passed through to the provider. The range depends on the provider and model.
     * It is recommended to set either `temperature` or `topP`, but not both.
     */
    temperature?: number;

    /**
     * Nucleus sampling.
     * The value is passed through to the provider. The range depends on the provider and model.
     * It is recommended to set either `temperature` or `topP`, but not both.
     */
    topP?: number;

    /**
     * Only sample from the top K options for each subsequent token.
     * Used to remove "long tail" low probability responses.
     * Recommended for advanced use cases only. You usually only need to use temperature.
     */
    topK?: number;

    /**
     * Frequency penalty setting.
     * It affects the likelihood of the model to repeatedly use the same words or phrases.
     * The value is passed through to the provider. The range depends on the provider and model.
     */
    frequencyPenalty?: number;

    /**
     * Presence penalty setting.
     * It affects the likelihood of the model to repeat information that is already in the prompt.
     * The value is passed through to the provider. The range depends on the provider and model.
     */
    presencePenalty?: number;

    /**
     * The seed (integer) to use for random sampling.
     * If set and supported by the model, calls will generate deterministic results.
     */
    seed?: number;
    // #endregion

    // #region Tools
    /**
     * The tools that the model can call. The model needs to support calling tools.
     */
    tools?: Llm.Tools;

    /**
     * The tool choice strategy. Default: 'auto'.
     */
    toolChoice?: Llm.Tool.Choice<Record<string, Llm.Tool>>;
    // #endregion

    // #region Flow
    /**
     * Stop sequences.
     * If set, the model will stop generating text when one of the stop sequences is generated.
     */
    stopSequences?: string[];

    /**
     * Maximum number of retries. Set to 0 to disable retries. Default: 2.
     */
    maxRetries?: number;

    /**
     * An optional abort signal that can be used to cancel the call.
     */
    abortSignal?: AbortSignal;

    /**
     * Maximum number of sequential LLM calls (steps), e.g. when you use tool calls. Must be at least 1.
     *
     * A maximum number is required to prevent infinite loops in the case of misconfigured tools.
     *
     * By default, it's set to 1, which means that only a single LLM call is made.
     */
    maxSteps?: number;
    // #endregion

    // #region Experimental
    /**
     * When enabled, the model will perform additional steps if the finish reason is "length" (experimental).
     *
     * By default, it's set to false.
     */
    experimental_continueSteps?: boolean;

    /**
     * Optional telemetry configuration (experimental).
     */
    experimental_telemetry?: any; // TODO: type

    /**
     * Additional provider-specific metadata. They are passed through
     * to the provider from the AI SDK and enable provider-specific
     * functionality that can be fully encapsulated in the provider.
     */
    experimental_providerMetadata?: any; // TODO: type

    /**
     * Limits the tools that are available for the model to call without
     * changing the tool call and result types in the result.
     */
    experimental_activeTools?: Array<string>; // TODO: type

    /**
     * A function that attempts to repair a tool call that failed to parse.
     */
    experimental_repairToolCalls?: Tool.Call.RepairFunction<Llm.Tools>;
    // experimental_output?: Output.Output<any>; // TODO
    // #endregion

    // #region Callbacks
    /**
     * Callback that is called when each step (LLM call) is finished, including intermediate steps.
     */
    onStepFinish?: (event: StepResult<Llm.Tools>) => Promise<void> | void;
    // #endregion
  };

  export namespace Completion {
    /**
     * Partial completion configuration.
     */
    export type Partial = $Partial<Completion>;

    export namespace Generate {
      export namespace Text {
        /**
         * The result of a `generateText` call.
         * It contains the generated text, the tool calls that were made during the generation, and the results of the tool calls.
         */
        export type Result<
          TOOLS extends Llm.Tools,
          OUTPUT,
        > = GenerateTextResult<TOOLS, OUTPUT>;
      }

      export namespace Object {
        /**
         * The result of a `generateObject` call.
         */
        export type Result<OBJECT> = GenerateObjectResult<OBJECT>;
      }
    }

    export namespace Stream {
      export namespace Text {
        /**
         * A result object for accessing different stream types and additional information.
         */
        export type Result<
          TOOLS extends Llm.Tools,
          PARTIAL_OUTPUT = never,
        > = StreamTextResult<TOOLS, PARTIAL_OUTPUT>;
      }

      export namespace Object {
        /**
         * The result of a `streamObject` call that contains the partial object stream and additional information.
         */
        export type Result<PARTIAL, RESULT, ELEMENT_STREAM> =
          StreamObjectResult<PARTIAL, RESULT, ELEMENT_STREAM>;
      }
    }
  }

  /**
   * A tool contains the description and the schema of the input that the tool expects.
   * This enables the language model to generate the input.
   *
   * The tool can also contain an optional execute function for the actual execution function of the tool.
   */
  export type Tool<
    PARAMETERS extends ZodTypeAny = any,
    RESULT = any,
  > = CoreTool<PARAMETERS, RESULT>;

  export namespace Tool {
    /**
     * Tool choice for the generation. It supports the following settings:
     *
     * - `auto` (default): the model can choose whether and which tools to call.
     * - `required`: the model must call a tool. It can choose which tool to call.
     * - `none`: the model must not call tools
     * - `{ type: 'tool', toolName: string (typed) }`: the model must call the specified tool
     */
    export type Choice<Tools extends Record<string, CoreTool>> =
      CoreToolChoice<Tools>;

    export namespace Call {
      /**
       * A function that attempts to repair a tool call that failed to parse.
       *
       * It receives the error and the context as arguments and returns the repair
       * tool call JSON as text.
       *
       * @param options.system - The system prompt.
       * @param options.messages - The messages in the current generation step.
       * @param options.toolCall - The tool call that failed to parse.
       * @param options.tools - The tools that are available.
       * @param options.parameterSchema - A function that returns the JSON Schema for a tool.
       * @param options.error - The error that occurred while parsing the tool call.
       */
      export type RepairFunction<Tools extends Llm.Tools> =
        ToolCallRepairFunction<Tools>;
    }
  }

  /**
   * A record of Llm.Tool
   */
  export type Tools<
    Key extends string = string,
    Tool extends Llm.Tool = Llm.Tool,
  > = Record<Key, Tool>;

  export namespace Provider {
    /**
     * Additional provider-specific options.
     */
    export type Options = ProviderMetadata;

    /**
     * Additional provider-specific metadata.
     */
    export type Metadata = ProviderMetadata;
  }
}
