import {
  generateObject,
  generateText,
  streamObject,
  streamText,
  type GenerateTextResult,
  type StreamTextResult,
  type ToolCallRepairFunction,
} from "ai";
import type { z } from "zod";
import type { Llm } from "./llm.types.ts";

export class CompletionBuilder<OPTIONS extends Llm.Completion.Partial> {
  public static get new() {
    return new CompletionBuilder<{}>({});
  }

  public static from<T extends Llm.Completion.Partial>(
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

  private merge<NEW_OPTIONS extends Llm.Completion.Partial>(
    options: NEW_OPTIONS,
  ) {
    return new CompletionBuilder({
      ...this.options,
      ...options,
    }) as CompletionBuilder<{
      [K in keyof OPTIONS | keyof NEW_OPTIONS]: K extends keyof NEW_OPTIONS
        ? NEW_OPTIONS[K]
        : K extends keyof OPTIONS
          ? OPTIONS[K]
          : never;
    }>;
  }

  public get $(): OPTIONS {
    return this.options;
  }

  public model<VALUE extends Llm.Model>(model: VALUE) {
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

  public tools<NEW_TOOLS extends Llm.Tools>(tools: NEW_TOOLS) {
    return this.merge({ tools });
  }

  public toolChoice<
    VALID_OPTIONS extends Llm.Completion.Partial & { tools: Llm.Tools },
    TOOL_CHOICE extends Llm.ToolChoice<VALID_OPTIONS["tools"]>,
  >(this: CompletionBuilder<VALID_OPTIONS>, toolChoice: TOOL_CHOICE) {
    return this.merge({ toolChoice: toolChoice as Llm.ToolChoice<Llm.Tools> });
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
  public activeTools<
    VALID_OPTIONS extends Llm.Completion.Partial & { tools: Llm.Tools },
    ACTIVE_TOOLS extends Array<keyof VALID_OPTIONS["tools"]>,
  >(this: CompletionBuilder<VALID_OPTIONS>, activeTools: ACTIVE_TOOLS) {
    return this.merge({ experimental_activeTools: activeTools as string[] });
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

  public generateText<
    VALID_OPTIONS extends Llm.Completion & { tools?: Llm.Tools },
    TOOLS extends VALID_OPTIONS["tools"],
  >(
    this: CompletionBuilder<VALID_OPTIONS>,
  ): TOOLS extends Llm.Tools
    ? Promise<GenerateTextResult<TOOLS, never>>
    : Promise<GenerateTextResult<never, never>> {
    return generateText(this.options) as any;
  }

  public streamText<
    VALID_OPTIONS extends Llm.Completion & { tools?: Llm.Tools },
    TOOLS extends VALID_OPTIONS["tools"],
  >(
    this: CompletionBuilder<VALID_OPTIONS>,
  ): TOOLS extends Llm.Tools
    ? Promise<StreamTextResult<TOOLS>>
    : Promise<StreamTextResult<never>> {
    return streamText(this.options) as any;
  }

  public generateObject<OBJECT, VALID_OPTIONS extends Llm.Completion>(
    this: CompletionBuilder<VALID_OPTIONS>,
    options: ObjectOptions<OBJECT>,
  ) {
    return generateObject({
      ...this.options,
      schema: options.schema,
      schemaName: options.name,
      schemaDescription: options.description,
    });
  }

  public streamObject<OBJECT, VALID_OPTIONS extends Llm.Completion>(
    this: CompletionBuilder<VALID_OPTIONS>,
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

export const completion: CompletionBuilder<{}> = CompletionBuilder.new;
