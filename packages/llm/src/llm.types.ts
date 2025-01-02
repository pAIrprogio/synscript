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
  StepResult,
  TextPart,
  ToolCallPart,
  ToolCallRepairFunction,
} from "ai";
import { z } from "zod";

type $Partial<T> = Partial<T>;

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

  export type Completion = {
    model: Llm.Model;
    messages: Llm.Message[];
    // LLM
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    seed?: number;
    // Tools
    tools?: Llm.Tools;
    toolChoice?: Llm.ToolChoice<Record<string, Llm.Tool>>;
    // Flow
    stopSequences?: string[];
    maxRetries?: number;
    abortSignal?: AbortSignal;
    maxSteps?: number;
    // Experimental
    experimental_continueSteps?: boolean;
    experimental_telemetry?: any; // TODO: type
    experimental_providerMetadata?: any; // TODO: type
    experimental_activeTools?: Array<string>; // TODO: type
    experimental_repairToolCalls?: ToolCallRepairFunction<Llm.Tools>;
    // experimental_output?: Output.Output<any>; // TODO
    // Callbacks
    onStepFinish?: (event: StepResult<Llm.Tools>) => Promise<void> | void;
  };

  export namespace Completion {
    export type Partial = $Partial<Completion>;
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
