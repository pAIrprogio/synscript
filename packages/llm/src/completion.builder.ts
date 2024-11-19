import { OneToN } from "@shared/ts.utils";
import { json } from "@synstack/json";
import { pipe, Resolvable } from "@synstack/resolved";
import { t } from "@synstack/text";
import { CompletionRunner } from "./completion.runner";
import { Llm } from "./llm.types";
export declare namespace CompletionBuilder {
  export type Merge<
    TCurrent extends Resolvable<Llm.Completion.Partial>,
    TNew extends Resolvable<Llm.Completion.Partial>,
    TCurrentValue extends Llm.Completion.Partial = Resolvable.Infer<TCurrent>,
    TNewValue extends Llm.Completion.Partial = Resolvable.Infer<TNew>,
  > =
    TNew | TCurrent extends Promise<any>
      ? CompletionBuilder<
          Promise<{
            [K in
              | keyof TCurrentValue
              | keyof TNewValue]: K extends keyof TNewValue
              ? TNewValue[K]
              : K extends keyof TCurrentValue
                ? TCurrentValue[K]
                : never;
          }>
        >
      : CompletionBuilder<{
          [K in
            | keyof TCurrentValue
            | keyof TNewValue]: K extends keyof TNewValue
            ? TNewValue[K]
            : K extends keyof TCurrentValue
              ? TCurrentValue[K]
              : never;
        }>;

  export type ForceValue<TValue, TForced> =
    Resolvable.Infer<TValue> extends undefined ? undefined : TForced;
}

// Todo: type tool response based on tools config
// Todo: switch to base pipeable
export class CompletionBuilder<T extends Resolvable<Llm.Completion.Partial>> {
  private readonly _completion: T;

  private constructor(completion: T) {
    this._completion = completion;
  }

  public static get new() {
    return new CompletionBuilder<{}>({});
  }

  public static from<U extends Resolvable<Llm.Completion.Partial>>(
    completion: U,
  ) {
    return CompletionBuilder.new.merge(completion);
  }

  public get $(): T {
    return this._completion;
  }

  public $_<R>(fn: (value: Resolvable.Infer<T>) => R) {
    // @ts-expect-error - To fix
    return pipe(this.$)._(fn);
  }

  public async toSync(): Promise<CompletionBuilder<Resolvable.Infer<T>>> {
    return new CompletionBuilder(await this.$);
  }

  /**
   * Override the values of the current builder with the provided values as object
   */
  public merge<U extends Resolvable<Llm.Completion.Partial>>(
    completion: U,
  ): CompletionBuilder.Merge<T, U> {
    return new CompletionBuilder(
      pipe([this._completion, completion] as const)._(([old, added]) => ({
        ...old,
        ...added,
      })).$,
    ) as CompletionBuilder.Merge<T, U>;
  }

  // Todo: allow calling as a template directly
  /**
   * Set the system prompt
   */
  public system<U extends Resolvable<string | undefined>>(system: U) {
    return this.merge(
      pipe(system)._((system) => ({
        system: system as CompletionBuilder.ForceValue<U, string>,
      })).$,
    );
  }

  /**
   * Set the llm temperature
   * @argument temperature The temperature value between 0 and 1
   */
  public temperature(temperature: number) {
    return this.merge(
      pipe(temperature)._((temperature) => ({
        temperature,
      })).$,
    );
  }

  /**
   * Set the maximum number of tokens to generate
   */
  public maxTokens<U extends Resolvable<number>>(maxTokens: U) {
    return this.merge(
      pipe(maxTokens)._((maxTokens: number) => ({ maxTokens })).$,
    );
  }

  /**
   * Set the stop sequences.
   *
   * If the LLM generates a stop sequence, the completion will stop.
   */
  public stopSequences<U extends Resolvable<OneToN<string> | undefined>>(
    sequences: U,
  ) {
    return this.merge(
      pipe(sequences)._((sequences) => ({
        stopSequences: sequences,
      })).$,
    );
  }

  /**
   * Set the top k tokens to consider for the completion
   */
  public topK<U extends Resolvable<number | undefined>>(topK: U) {
    return this.merge(
      pipe(topK)._((topK) => ({
        topK,
      })).$,
    );
  }

  /**
   * Set the top p tokens to consider for the completion
   */
  public topP<U extends Resolvable<number | undefined>>(topP: U) {
    return this.merge(
      pipe(topP)._((topP) => ({
        topP,
      })).$,
    );
  }

  /**
   * Reset the tools
   */
  public clearTools() {
    return this.merge({
      toolsConfig: undefined,
    });
  }

  /**
   * Set the tools available to the LLM
   *
   * @argument tools The tools to use
   * @argument requireToolUse Whether to require the LLM to use the tools
   */
  public tools<
    TTools extends Resolvable<OneToN<Llm.Tool>>,
    TRequire extends boolean = false,
  >(tools: TTools, requireToolUse: TRequire = false as TRequire) {
    return this.merge(
      pipe(tools)._((tools) => ({
        toolsConfig: {
          type: "multi" as const,
          tools,
          requireToolUse: requireToolUse,
        } as Llm.Completion.ToolConfig.Multi<Awaited<TTools>, TRequire>,
      })).$,
    );
  }

  /**
   * Set a single tool for the LLM to use. The LLM will always respond with this tool
   */
  public tool<TTool extends Resolvable<Llm.Tool>>(tool: TTool) {
    return this.merge(
      pipe(tool)._((tool) => ({
        toolsConfig: {
          type: "single",
          tool,
        } as Llm.Completion.ToolConfig.Single<Awaited<TTool>>,
      })).$,
    );
  }

  /**
   * Set the stop reason for the completion
   */
  public stopReason<U extends Llm.Completion.StopReason | undefined>(
    stopReason: U,
  ) {
    return this.merge(
      pipe(stopReason)._((stopReason) => ({
        stopReason,
      })).$,
    );
  }

  /**
   * Set the tokens usage
   */
  public usage<U extends Resolvable<Llm.Completion.Usage | undefined>>(
    usage: U,
  ) {
    return this.merge(
      pipe(usage)._((usage) => ({
        usage: usage as CompletionBuilder.ForceValue<U, Llm.Completion.Usage>,
      })).$,
    );
  }

  /**
   * Add usage to existing usage
   */
  public addUsage<U extends Resolvable<Llm.Completion.Usage>>(usage: U) {
    return this.merge(
      pipe([this.$, usage] as const)._(([$, usage]) => ({
        usage: {
          inputTokens: $.usage?.inputTokens ?? 0 + usage.inputTokens,
          outputTokens: $.usage?.outputTokens ?? 0 + usage.outputTokens,
        },
      })).$,
    );
  }

  /**
   * Set messages
   */
  public messages(
    messages: Resolvable<Array<Llm.Message>> | Array<Resolvable<Llm.Message>>,
  ) {
    return this.merge(
      pipe(messages)._((messages) => ({
        messages: messages,
      })).$,
    );
  }

  /**
   * Add messages
   */
  public addMessages(
    messages: Resolvable<Array<Llm.Message>> | Array<Resolvable<Llm.Message>>,
  ) {
    return this.merge(
      pipe([this.$, messages] as const)._(([$, messages]) => ({
        messages: [...($.messages ?? []), ...messages] as Array<Llm.Message>,
      })).$,
    );
  }

  /**
   * Add assistant message
   */
  public addAssistantMessage<
    U extends Resolvable<Llm.Assistant.Message>,
    V extends { messages: Array<Llm.Message> },
  >(this: CompletionBuilder<Resolvable<V>>, message: U) {
    return this.merge(
      pipe([this.$, message] as const)._(([$, message]) => {
        const $messages = $.messages ?? [];
        const lastMessage = $.messages.at(-1);
        if (!lastMessage)
          return {
            messages: [message],
          };
        if (lastMessage.role !== "assistant")
          return {
            messages: [...$messages, message],
          };
        return {
          messages: [
            ...$messages.slice(0, -1),
            {
              ...lastMessage,
              content: [...lastMessage.content, ...message.content],
            },
          ],
        };
      }).$,
    );
  }

  /**
   * Execute completion on Llm runner
   */
  public run<
    TRunnerCompletion extends Llm.Completion.Partial,
    TCompletion extends TRunnerCompletion,
  >(
    this: CompletionBuilder<TCompletion>,
    runner: CompletionRunner<TRunnerCompletion>,
  ) {
    return runner.runChatCompletion(this);
  }

  public lastMessage() {
    return pipe(this.$)._((completion) => {
      const lastMessage = completion.messages?.at(-1);
      if (!lastMessage) throw new EmptyMessagesException(completion);
      return lastMessage;
    }).$;
  }

  /**
   * Get last message as text
   */
  public lastMessageText() {
    return pipe(this.lastMessage())._((message) =>
      message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join(""),
    ).$;
  }

  /**
   * Get last message tool calls
   */
  public lastMessageToolCalls<
    C extends {
      stopReason: Llm.Completion.StopReason;
      toolsConfig: Llm.Completion.ToolConfig;
    },
  >(
    this: CompletionBuilder<C>,
  ): Llm.Message.Content.ToolCall.ResponseFromToolConfig<C["toolsConfig"]> {
    // @ts-expect-error - To fix
    return pipe(this.lastMessage())._((message) => {
      /* Todo:
        We need to decide if we want to allow non-tool_call responses to call this function
        or if we let it go

        - Forcing stopReason to be "tool_call" will force the user to check if the result
          is a tool call and handle the error otherwise
        - But it also implies a lot of boilerplate code on each run where we need the tool response
      */
      if (message.role !== "assistant") return [];
      return message.content.filter((c) => c.type === "tool_call");
    }).$;
  }
}

export class EmptyMessagesException extends Error {
  constructor(completion: Llm.Completion.Partial) {
    super(t`
      No messages in current completion state:
        ${json.serialize(completion, { pretty: true })} 
    `);
  }
}

export const completion = CompletionBuilder.new;
