import type { StepResult } from "ai";
import {
  generateObject,
  generateText,
  streamObject,
  streamText,
  type ToolCallRepairFunction,
} from "ai";
import type { z } from "zod";
import type { Llm } from "./llm.types.ts";

type $Partial<T> = Partial<T>;

export declare namespace CompletionBuilder {
  export type Merge<
    CURRENT_OPTIONS extends CompletionBuilder.Options.Partial,
    NEW_OPTIONS extends CompletionBuilder.Options.Partial,
  > = CompletionBuilder<CURRENT_OPTIONS & NEW_OPTIONS>;

  export type Options<TOOLS extends Llm.Tools = Llm.Tools> = {
    model: Llm.Model;
    messages: Llm.Message[];
    // Tools
    tools?: TOOLS;
    toolChoice?: Llm.ToolChoice<TOOLS>;
    // LLM
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    seed?: number;
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
    experimental_repairToolCalls?: ToolCallRepairFunction<TOOLS>;
    // experimental_output?: Output.Output<any>; // TODO
    // Callbacks
    onStepFinish?: (event: StepResult<TOOLS>) => Promise<void> | void;
  };

  export namespace Options {
    export type Partial<TOOLS extends Llm.Tools = Llm.Tools> = $Partial<
      Options<TOOLS>
    >;

    export type Merge<
      TCurrentValue extends Partial,
      TNewValue extends Partial,
    > = {
      [K in keyof TCurrentValue | keyof TNewValue]: K extends keyof TNewValue
        ? TNewValue[K]
        : K extends keyof TCurrentValue
          ? TCurrentValue[K]
          : never;
    } & {};

    export type MergeTools<
      CurrentOptions extends Options.Partial,
      NewTools extends Llm.Tools,
    > =
      CurrentOptions extends Options.Partial<infer CurrentTool>
        ? CurrentTool extends undefined
          ? NewTools
          : Merge<CurrentTool, NewTools>
        : never;
  }
}

export class CompletionBuilder<
  OPTIONS extends CompletionBuilder.Options.Partial,
> {
  public static from<T extends CompletionBuilder.Options.Partial>(
    options?: T,
  ): CompletionBuilder<T extends undefined ? {} : T> {
    return new CompletionBuilder(
      (options ?? {}) as T extends undefined ? {} : T,
    );
  }

  private readonly options: OPTIONS;

  constructor(options: OPTIONS) {
    this.options = options;
  }

  private merge<NEW_OPTIONS extends CompletionBuilder.Options.Partial>(
    options: NEW_OPTIONS,
  ): CompletionBuilder.Merge<OPTIONS, NEW_OPTIONS> {
    return new CompletionBuilder({
      ...this.options,
      ...options,
    }) as CompletionBuilder.Merge<OPTIONS, NEW_OPTIONS>;
  }

  public get $(): OPTIONS {
    return this.options;
  }

  public model(model: Llm.Model) {
    return this.merge({ model });
  }

  // #region Messages

  public messages(messages: Array<Llm.Message>) {
    return this.merge({ messages });
  }

  /**
   * @deprecated To be implemented
   */
  public appendMessages() {
    throw new Error("Not implemented");
  }

  // #endregion

  // #region Tools

  public tools(tools: Llm.Tools) {
    return this.merge({ tools });
  }

  public toolChoice(toolChoice: Llm.ToolChoice<Llm.Tools>) {
    return this.merge({ toolChoice });
  }

  /**
   * @experimental
   */
  public repairToolCalls(repairToolCalls: ToolCallRepairFunction<Llm.Tools>) {
    return this.merge({ experimental_repairToolCalls: repairToolCalls });
  }

  /**
   * @experimental
   */
  public activeTools(activeTools: Array<string>) {
    return this.merge({ experimental_activeTools: activeTools });
  }

  // #endregion

  // #region LLM

  public maxTokens(maxTokens: number) {
    return this.merge({ maxTokens });
  }

  public temperature(temperature: number) {
    return this.merge({ temperature });
  }

  public topP(topP: number) {
    return this.merge({ topP });
  }

  public topK(topK: number) {
    return this.merge({ topK });
  }

  public frequencyPenalty(frequencyPenalty: number) {
    return this.merge({ frequencyPenalty });
  }

  public presencePenalty(presencePenalty: number) {
    return this.merge({ presencePenalty });
  }

  public seed(seed: number) {
    return this.merge({ seed });
  }

  // #endregion

  // # region Flow

  public stopSequences(stopSequences: string[]) {
    return this.merge({ stopSequences });
  }

  public maxRetries(maxRetries: number) {
    return this.merge({ maxRetries });
  }

  public abortSignal(abortSignal: AbortSignal) {
    return this.merge({ abortSignal });
  }

  public maxSteps(maxSteps: number) {
    return this.merge({ maxSteps });
  }

  /**
   * @experimental
   */
  public continueSteps(continueSteps: boolean) {
    return this.merge({ experimental_continueSteps: continueSteps });
  }

  // #endregion

  // #region Experimental

  /**
   * @experimental
   */
  public telemetry(telemetry: any) {
    return this.merge({ experimental_telemetry: telemetry });
  }

  /**
   * @experimental
   */
  public providerMetadata(providerMetadata: any) {
    return this.merge({ experimental_providerMetadata: providerMetadata });
  }

  // public output(output: "object" | "array" | "no-schema") {
  //   return this.merge({ output });
  // }

  // #endregion

  // #region Generate

  public generateText(this: CompletionBuilder<CompletionBuilder.Options>) {
    return generateText(this.options);
  }

  public streamText(this: CompletionBuilder<CompletionBuilder.Options>) {
    return streamText(this.options);
  }

  public generateObject<OBJECT>(
    this: CompletionBuilder<CompletionBuilder.Options>,
    options: ObjectOptions<OBJECT>,
  ) {
    return generateObject({
      ...this.options,
      schema: options.schema,
      schemaName: options.name,
      schemaDescription: options.description,
    });
  }

  public streamObject<OBJECT>(
    this: CompletionBuilder<CompletionBuilder.Options>,
    options: ObjectOptions<OBJECT>,
  ) {
    return streamObject({
      ...this.options,
      schema: options.schema,
      schemaName: options.name,
      schemaDescription: options.description,
    });
  }

  // #endregion
}

interface ObjectOptions<T> {
  schema: z.Schema<T>;
  name?: string;
  description?: string;
}

export const completion = CompletionBuilder.from({});
