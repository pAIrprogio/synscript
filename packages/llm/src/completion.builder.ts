import { pipe, type Resolvable } from "@synstack/resolved";
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
  /**
   * Create a new CompletionBuilder with an empty configuration.
   */
  public static get new() {
    return new CompletionBuilder<{}>({});
  }

  /**
   * Create a new CompletionBuilder from an existing configuration.
   */
  public static from<T extends Llm.Completion.Partial>(
    options?: T,
  ): CompletionBuilder<T extends undefined ? {} : T> {
    return new CompletionBuilder(
      (options ?? {}) as T extends undefined ? {} : T,
    );
  }

  private readonly _options: OPTIONS;

  private constructor(options: OPTIONS) {
    this._options = options;
  }

  /**
   * Merge current options with another configuration
   */
  public merge<NEW_OPTIONS extends Llm.Completion.Partial>(
    options: NEW_OPTIONS,
  ) {
    const newOptions =
      options instanceof CompletionBuilder ? options._options : options;

    return new CompletionBuilder({
      ...this._options,
      ...newOptions,
    }) as CompletionBuilder<{
      [K in keyof OPTIONS | keyof NEW_OPTIONS]: K extends keyof NEW_OPTIONS
        ? NEW_OPTIONS[K]
        : K extends keyof OPTIONS
          ? OPTIONS[K]
          : never;
    }>;
  }

  /**
   * Get the current options as a plain object.
   */
  public get options(): OPTIONS {
    return this._options;
  }

  /**
   * Get the current options as a plain object.
   */
  public valueOf(): OPTIONS {
    return this._options;
  }

  /**
   * Set the language model to use.
   */
  public model<VALUE extends Llm.Model>(model: VALUE) {
    return this.merge({ model });
  }

  // #region Messages

  /**
   * Set the messages to use in the prompt.
   */
  public messages(messages: Resolvable.ArrayOf<Llm.Message>) {
    return this.merge({ messages: pipe(messages).$ });
  }

  /**
   * Append messages to the existing prompt messages.
   */
  public appendMessages(messages: Array<Llm.Message>) {
    return this.merge({
      messages: pipe([
        this._options.messages ?? [],
        pipe(messages).$,
      ] as const)._(([oldMsgs, newMsgs]) => [...oldMsgs, ...newMsgs]).$,
    });
  }

  // #endregion

  // #region Tools

  /**
   * Set the tools that the model can call. The model needs to support calling tools.
   */
  public tools<NEW_TOOLS extends Llm.Tools>(tools: NEW_TOOLS) {
    return this.merge({ tools });
  }

  /**
   * Set the tool choice strategy. Default: 'auto'.
   *
   * Supports the following settings:
   * - `auto` (default): the model can choose whether and which tools to call.
   * - `required`: the model must call a tool. It can choose which tool to call.
   * - `none`: the model must not call tools
   * - `{ type: 'tool', toolName: string (typed) }`: the model must call the specified tool
   */
  public toolChoice<
    VALID_OPTIONS extends Llm.Completion.Partial & { tools: Llm.Tools },
    TOOL_CHOICE extends Llm.ToolChoice<VALID_OPTIONS["tools"]>,
  >(this: CompletionBuilder<VALID_OPTIONS>, toolChoice: TOOL_CHOICE) {
    return this.merge({ toolChoice: toolChoice as Llm.ToolChoice<Llm.Tools> });
  }

  /**
   * Set a function that attempts to repair a tool call that failed to parse.
   * @experimental
   */
  public repairToolCalls(repairToolCalls: ToolCallRepairFunction<Llm.Tools>) {
    return this.merge({ experimental_repairToolCalls: repairToolCalls });
  }

  /**
   * Limit the tools that are available for the model to call without
   * changing the tool call and result types in the result.
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

  /**
   * Maximum number of tokens to generate.
   */
  public maxTokens(maxTokens: number) {
    return this.merge({ maxTokens });
  }

  /**
   * Temperature setting.
   * The value is passed through to the provider. The range depends on the provider and model.
   * It is recommended to set either `temperature` or `topP`, but not both.
   */
  public temperature(temperature: number) {
    return this.merge({ temperature });
  }

  /**
   * Nucleus sampling.
   * The value is passed through to the provider. The range depends on the provider and model.
   * It is recommended to set either `temperature` or `topP`, but not both.
   */
  public topP(topP: number) {
    return this.merge({ topP });
  }

  /**
   * Only sample from the top K options for each subsequent token.
   * Used to remove "long tail" low probability responses.
   * Recommended for advanced use cases only. You usually only need to use temperature.
   */
  public topK(topK: number) {
    return this.merge({ topK });
  }

  /**
   * Frequency penalty setting.
   * It affects the likelihood of the model to repeatedly use the same words or phrases.
   * The value is passed through to the provider. The range depends on the provider and model.
   */
  public frequencyPenalty(frequencyPenalty: number) {
    return this.merge({ frequencyPenalty });
  }

  /**
   * Presence penalty setting.
   * It affects the likelihood of the model to repeat information that is already in the prompt.
   * The value is passed through to the provider. The range depends on the provider and model.
   */
  public presencePenalty(presencePenalty: number) {
    return this.merge({ presencePenalty });
  }

  /**
   * The seed (integer) to use for random sampling.
   * If set and supported by the model, calls will generate deterministic results.
   */
  public seed(seed: number) {
    return this.merge({ seed });
  }

  // #endregion

  // # region Flow

  /**
   * Stop sequences.
   * If set, the model will stop generating text when one of the stop sequences is generated.
   */
  public stopSequences(stopSequences: string[]) {
    return this.merge({ stopSequences });
  }

  /**
   * Maximum number of retries. Set to 0 to disable retries. Default: 2.
   */
  public maxRetries(maxRetries: number) {
    return this.merge({ maxRetries });
  }

  /**
   * An optional abort signal that can be used to cancel the call.
   */
  public abortSignal(abortSignal: AbortSignal) {
    return this.merge({ abortSignal });
  }

  /**
   * Maximum number of sequential LLM calls (steps), e.g. when you use tool calls. Must be at least 1.
   *
   * A maximum number is required to prevent infinite loops in the case of misconfigured tools.
   *
   * By default, it's set to 1, which means that only a single LLM call is made.
   */
  public maxSteps(maxSteps: number) {
    return this.merge({ maxSteps });
  }

  /**
   * When enabled, the model will perform additional steps if the finish reason is "length" (experimental).
   *
   * By default, it's set to false.
   * @experimental
   */
  public continueSteps(continueSteps: boolean) {
    return this.merge({ experimental_continueSteps: continueSteps });
  }

  // #endregion

  // #region Experimental

  /**
   * Optional telemetry configuration.
   * @experimental
   */
  public telemetry(telemetry: any) {
    return this.merge({ experimental_telemetry: telemetry });
  }

  /**
   * Additional provider-specific metadata. They are passed through
   * to the provider from the AI SDK and enable provider-specific
   * functionality that can be fully encapsulated in the provider.
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

  /**
   * Generate a text and call tools for a given prompt using a language model.
   *
   * This function does not stream the output. If you want to stream the output, use `streamText` instead.
   *
   * @returns A result object that contains the generated text, the results of the tool calls, and additional information.
   */
  public generateText<
    VALID_OPTIONS extends Llm.Completion & { tools?: Llm.Tools },
    TOOLS extends VALID_OPTIONS["tools"],
  >(
    this: CompletionBuilder<VALID_OPTIONS>,
  ): TOOLS extends Llm.Tools
    ? Promise<GenerateTextResult<TOOLS, never>>
    : Promise<GenerateTextResult<never, never>> {
    return pipe(this._options.messages)._((msgs) =>
      generateText({
        ...this._options,
        messages: msgs,
      }),
    ).$ as any;
  }

  /**
   * Generate a text and call tools for a given prompt using a language model.
   *
   * This function streams the output. If you do not want to stream the output, use `generateText` instead.
   *
   * @returns A result object for accessing different stream types and additional information.
   */
  public streamText<
    VALID_OPTIONS extends Llm.Completion & { tools?: Llm.Tools },
    TOOLS extends VALID_OPTIONS["tools"],
  >(
    this: CompletionBuilder<VALID_OPTIONS>,
  ): TOOLS extends Llm.Tools
    ? Promise<StreamTextResult<TOOLS>>
    : Promise<StreamTextResult<never>> {
    return pipe(this._options.messages)._((msgs) =>
      streamText({
        ...this._options,
        messages: msgs,
      }),
    ).$ as any;
  }

  /**
   * Generate a structured, typed object for a given prompt and schema using a language model.
   *
   * This function does not stream the output. If you want to stream the output, use `streamObject` instead.
   *
   * @returns A result object that contains the generated object, the finish reason, the token usage, and additional information.
   */
  public generateObject<OBJECT, VALID_OPTIONS extends Llm.Completion>(
    this: CompletionBuilder<VALID_OPTIONS>,
    options: ObjectOptions<OBJECT>,
  ) {
    return pipe(this._options.messages)._((msgs) =>
      generateObject({
        ...this._options,
        messages: msgs,
        schema: options.schema,
        schemaName: options.name,
        schemaDescription: options.description,
      }),
    ).$;
  }

  /**
   * Generate a structured, typed object for a given prompt and schema using a language model.
   *
   * This function streams the output. If you do not want to stream the output, use `generateObject` instead.
   *
   * @returns A result object for accessing the partial object stream and additional information.
   */
  public streamObject<OBJECT, VALID_OPTIONS extends Llm.Completion>(
    this: CompletionBuilder<VALID_OPTIONS>,
    options: ObjectOptions<OBJECT>,
  ) {
    return pipe(this._options.messages)._((msgs) =>
      streamObject({
        ...this._options,
        messages: msgs,
        schema: options.schema,
        schemaName: options.name,
        schemaDescription: options.description,
      }),
    ).$;
  }

  // #endregion
}

interface ObjectOptions<T> {
  schema: z.Schema<T>;
  name?: string;
  description?: string;
}

export const completion: CompletionBuilder<{}> = CompletionBuilder.new;
