import { pipe, type Resolvable } from "@synstack/resolved";
import { generateObject, generateText, streamObject, streamText } from "ai";
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

  protected constructor(options: OPTIONS) {
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

  // #region Model

  /**
   * Set the language model to use.
   */
  public model<VALUE extends Llm.Model>(model: VALUE) {
    return this.merge({ model });
  }

  /**
   * Set the middlewares to wrap the model with.
   */
  public middlewares(middlewares: Array<Llm.Model.Middleware>) {
    return this.merge({ middlewares });
  }

  /**
   * Append a middleware to the existing middlewares.
   *
   * Appended middlewares will be executed after the existing middlewares.
   */
  public appendMiddlewares(middlewares: Array<Llm.Model.Middleware>) {
    return this.merge({
      middlewares: [...(this._options.middlewares ?? []), ...middlewares],
    });
  }

  /**
   * Prepend a middleware to the existing middlewares.
   *
   * Prepended middlewares will be executed before the existing middlewares.
   */
  public prependMiddlewares(middlewares: Array<Llm.Model.Middleware>) {
    return this.merge({
      middlewares: [...middlewares, ...(this._options.middlewares ?? [])],
    });
  }

  // #endregion

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
  public appendMessages(messages: Resolvable.ArrayOf<Llm.Message>) {
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
    TOOL_CHOICE extends Llm.Tool.Choice<VALID_OPTIONS["tools"]>,
  >(this: CompletionBuilder<VALID_OPTIONS>, toolChoice: TOOL_CHOICE) {
    return this.merge({
      toolChoice: toolChoice as Llm.Tool.Choice<Llm.Tools>,
    });
  }

  /**
   * Set a function that attempts to repair a tool call that failed to parse.
   * @experimental
   */
  public repairToolCalls(
    repairToolCalls: Llm.Tool.Call.RepairFunction<Llm.Tools>,
  ) {
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
   * Set provider-specific options.
   */
  public providerOptions(providerOptions: Llm.Provider.Options) {
    return this.merge({ providerOptions: providerOptions });
  }

  // public output(output: "object" | "array" | "no-schema") {
  //   return this.merge({ output });
  // }

  // #endregion

  // #region Generate

  private get modelWithMiddlewares() {
    if (!this._options.middlewares) return this._options.model;

    return this._options.middlewares.reduce(
      (model, middleware) => middleware(model),
      this._options.model!,
    );
  }

  /**
   * Generate a text and call tools for a given prompt using a language model.
   *
   * This function does not stream the output. If you want to stream the output, use `streamText` instead.
   *
   * @returns A result object that contains the generated text, the results of the tool calls, and additional information.
   */
  public async generateText<
    VALID_OPTIONS extends Llm.Completion & { tools?: Llm.Tools },
    TOOLS extends VALID_OPTIONS["tools"],
  >(
    this: CompletionBuilder<VALID_OPTIONS>,
  ): Promise<
    TOOLS extends Llm.Tools
      ? Llm.Completion.Generate.Text.Result<TOOLS, never>
      : Llm.Completion.Generate.Text.Result<never, never>
  > {
    const resolvedConfig = await pipe(this._options.messages)._((messages) => ({
      ...this._options,
      model: this.modelWithMiddlewares,
      messages,
    })).$;

    const res = await generateText(resolvedConfig);

    // Todo add a CompletionBuilder instance to the result
    return res as any;
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
    ? Promise<Llm.Completion.Stream.Text.Result<TOOLS>>
    : Promise<Llm.Completion.Stream.Text.Result<never>> {
    return pipe(this._options.messages)._((msgs) =>
      streamText({
        ...this._options,
        model: this.modelWithMiddlewares,
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
        model: this.modelWithMiddlewares,
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
        model: this.modelWithMiddlewares,
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

/**
 * Create a new completion builder instance for configuring LLM completions.
 *
 * The completion builder provides a type-safe API to configure LLM completions with various options:
 * - Model configuration (model, maxTokens, temperature, etc.)
 * - Flow control (maxSteps, maxRetries, stopSequences, etc.)
 * - Generation methods (generateText, streamText, generateObject, streamObject)
 *
 * @example
 * ```ts
 * import { completion, systemMsg, userMsg, assistantMsg } from "@synstack/llm";
 * import { openai } from "@ai-sdk/openai";
 * import { z } from "zod";
 *
 * // Basic completion with model configuration
 * const baseCompletion = completion
 *   .model(openai("gpt-4"))
 *   .maxTokens(20)
 *   .temperature(0.8);
 *
 * // Example with tools and messages
 * const agent = baseCompletion
 *   .tools({
 *     search: {
 *       description: "Search for information",
 *       parameters: z.object({
 *         query: z.string()
 *       })
 *     },
 *     getWeather: {
 *       description: "Get weather for a location",
 *       parameters: z.object({
 *         location: z.string(),
 *         unit: z.enum(["celsius", "fahrenheit"])
 *       })
 *     }
 *   })
 *   .activeTools(["search", "getWeather"])
 *   .toolChoice("auto")
 *   .prompt([
 *     systemMsg`
 *       You are a helpful assistant that can search for information
 *       and get weather data.
 *     `,
 *     userMsg`
 *       What's the weather like in Paris?
 *     `,
 *     assistantMsg`
 *       Let me check the weather for you.
 *     `,
 *   ])
 *   .generateText();
 * ```
 */
export const completion: CompletionBuilder<{}> = CompletionBuilder.new;
