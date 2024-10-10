import { type Anthropic } from "@anthropic-ai/sdk";
import { Cache } from "@shared/cache.types";
import { Merge, never } from "@shared/ts.utils";
import { Resolvable } from "@synstack/resolved";
import zodToJsonSchema from "zod-to-json-schema";
import { CompletionBuilder } from "../completion.builder";
import { CompletionRunner } from "../completion.runner";
import { Llm } from "../llm.types";

type BasePartial<T> = Partial<T>;

export declare namespace AnthropicRunner {
  export type Instance<T extends Config> = AnthropicRunner<T>;

  namespace Instance {
    export type Ready = CompletionRunner<Completion>;
  }

  interface Config {
    model: Anthropic.Model;
    client: Anthropic;
    retries: number;
    continues: number;
    cache?: Cache;
    retryBackoff?: number;
  }

  namespace Config {
    export type Partial = BasePartial<Config>;
  }

  type Completion = Llm.Completion;

  namespace Completion {
    export type Partial = BasePartial<Completion>;
  }
}

export class AnthropicRunner<TConfig extends AnthropicRunner.Config.Partial>
  implements CompletionRunner<AnthropicRunner.Completion>
{
  // implements CompletionRunner<AnthropicRunner.Completion>
  private readonly _config: TConfig;

  public static readonly MODELS = {
    CLAUDE_3_SMALL: "claude-3-haiku-20240307",
    CLAUDE_3_MEDIUM: "claude-3-sonnet-20240229",
    CLAUDE_3_LARGE: "claude-3-opus-20240229",
    CLAUDE_3_5_MEDIUM: "claude-3-5-sonnet-20240620",
  };

  // #region build

  private constructor(config: TConfig) {
    this._config = {
      ...config,
      continues: config.continues ?? 0,
      retries: config.retries ?? 0,
    };
  }

  public static new(this: void) {
    return new AnthropicRunner({
      retries: 0,
      continues: 0,
    });
  }

  public static from<U extends AnthropicRunner.Config.Partial>(
    this: void,
    config: U,
  ) {
    return new AnthropicRunner({
      continues: 0,
      retries: 0,
      ...config,
    });
  }

  public client(client: Anthropic) {
    return new AnthropicRunner({ ...this._config, client });
  }

  public retries(retries: number) {
    return new AnthropicRunner({
      ...this._config,
      retries,
    });
  }

  public cache(cache?: Cache) {
    return new AnthropicRunner({ ...this._config, cache });
  }

  public continues(continues: number) {
    return new AnthropicRunner({
      ...this._config,
      continues,
    });
  }

  public retryBackoff(retryBackoff?: number) {
    return new AnthropicRunner({
      ...this._config,
      retryBackoff,
    });
  }

  public model(model: Anthropic.Model) {
    return new AnthropicRunner({ ...this._config, model });
  }

  // #endregion

  // #region run

  public async chatCompletion(
    this: AnthropicRunner<AnthropicRunner.Config>,
    completion: CompletionBuilder<Resolvable<AnthropicRunner.Completion>>,
  ): Promise<{
    message: Llm.Assistant.Message;
    stopReason: Llm.StopReason;
    usage: Llm.Usage;
  }> {
    const rawCompletion = await completion.$;
    const anthropicCompletion = this.mapCompletionQuery(rawCompletion);

    const query = this._config.cache
      ? this._config.cache.fn(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this._config.client.messages.create.bind(
            this._config.client.messages,
          ),
        )
      : this._config.client.messages.create.bind(this._config.client.messages);

    // Stream typing is broken here
    const res = (await query(
      anthropicCompletion,
    )) as Anthropic.Messages.Message;

    // Add suffix to the last message
    const suffix = res.stop_sequence;
    let message = AnthropicRunner.mapResponseMessage(res);
    const lastContent = message.content.at(-1);
    if (suffix && lastContent?.type === "text") {
      message = {
        ...message,
        content: [
          ...message.content.slice(0, -1),
          { ...lastContent, text: lastContent.text + suffix },
        ],
      };
    }

    const usage: Llm.Usage = {
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };

    return {
      message: message,
      stopReason: AnthropicRunner.mapStopReason(res.stop_reason),
      usage,
    };
  }

  public async runChatCompletion<T extends AnthropicRunner.Completion>(
    this: AnthropicRunner<AnthropicRunner.Config>,
    completion: CompletionBuilder<Resolvable<T>>,
  ): Promise<CompletionBuilder<Merge<T, Llm.Completion.Response.Part>>> {
    try {
      const { message, usage, stopReason } =
        await this.chatCompletion(completion);

      // Todo: There is some TS fuckup here that makes the type of outputCompletion be unknown
      const outputCompletion = completion
        .addAssistantMessage(message)
        .addUsage(usage)
        .stopReason(stopReason) as CompletionBuilder<
        Merge<T, Llm.Completion.Response.Part>
      >;

      if (stopReason === "max_tokens") {
        if (this._config.continues === 0) return outputCompletion.toSync();
        // @ts-expect-error - Output is tested
        return this.continues(this._config.continues - 1).runChatCompletion(
          outputCompletion,
        );
      }

      return outputCompletion.toSync();
    } catch (error) {
      if (this._config.retries === 0) throw error;

      if (this._config.retryBackoff && this._config.retryBackoff > 0)
        await new Promise((resolve) =>
          setTimeout(resolve, this._config.retryBackoff),
        );

      return this.retries(this._config.retries - 1).runChatCompletion(
        completion,
      );
    }
  }
  // #endregion

  // #region map Anthropic -> Domain
  private static mapStopReason(
    reason: Anthropic.Messages.Message["stop_reason"],
  ): Llm.StopReason {
    if (reason === "end_turn") return "end";
    if (reason === "max_tokens") return "max_tokens";
    if (reason === "tool_use") return "tool_call";
    if (reason === "stop_sequence") return "stop_sequence";
    if (reason === null) return "end";

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    never(reason);
  }

  private static mapResponseMessage(message: Anthropic.Messages.Message) {
    return {
      role: "assistant",
      content: message.content.map(AnthropicRunner.mapResponseContent),
    } as Llm.Assistant.Message;
  }

  private static mapResponseContent(
    this: void,
    content: Anthropic.ContentBlock,
  ): Llm.Message.Content {
    if (content.type === "text") {
      return {
        type: "text",
        text: content.text,
      } as Llm.Message.Content.Text;
    }

    if (content.type === "tool_use") {
      return {
        type: "tool_call",
        toolCallId: content.id,
        toolName: content.name,
        toolArgs: content.input,
      } as Llm.Message.Content.ToolCall;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    never(content);
  }

  // #endregion

  // #region map Domain -> Anthropic

  public mapCompletionQuery(
    this: AnthropicRunner<{ model: string }>,
    query: AnthropicRunner.Completion,
  ): Anthropic.Messages.MessageCreateParamsNonStreaming {
    return {
      model: this._config.model,
      system: query.system,
      stop_sequences: query.stopSequences,
      top_k: query.topK,
      top_p: query.topP,
      max_tokens: query.maxTokens,
      temperature: query.temperature,
      tool_choice: AnthropicRunner.mapToolChoice(query.toolsConfig),
      tools: AnthropicRunner.mapToolConfig(query.toolsConfig),
      messages: query.messages.map(AnthropicRunner.mapMessage),
    };
  }

  private static mapToolConfig(this: void, toolConfig?: Llm.Completion.Tool) {
    if (!toolConfig) return undefined;
    if (toolConfig.type === "single")
      return [AnthropicRunner.mapTool(toolConfig.tool)];
    return toolConfig.tools.map(AnthropicRunner.mapTool);
  }

  private static mapTool(this: void, functionCall: Llm.Tool): Anthropic.Tool {
    const schema = zodToJsonSchema(functionCall.schema);
    delete schema.$schema;
    return {
      name: functionCall.name,
      description: functionCall.schema?.description,
      input_schema: schema as Anthropic.Tool.InputSchema,
    };
  }

  private static mapToolChoice(
    toolConfig?: Llm.Completion.Tool,
  ): Anthropic.Messages.MessageCreateParamsNonStreaming["tool_choice"] {
    if (!toolConfig) return undefined;

    if (toolConfig.type === "single")
      return {
        type: "tool",
        name: toolConfig.tool.name,
      };

    if (toolConfig.requireToolUse) return { type: "any" };

    return { type: "auto" };
  }

  private static mapMessage(
    this: void,
    message: Llm.Message,
  ): Anthropic.MessageParam {
    if (message.role === "user")
      return {
        role: "user",
        content: message.content.map(AnthropicRunner.mapMessageContent),
      };
    if (message.role === "assistant")
      return {
        role: "assistant",
        content: message.content.map(AnthropicRunner.mapMessageContent),
      };
    never(message);
  }

  private static mapMessageContent(
    this: void,
    messagePart: Llm.Message.Content,
  ) {
    if (messagePart.type === "text")
      return messagePart as Anthropic.Messages.TextBlockParam;

    if (messagePart.type === "image")
      return {
        type: "image",
        source: {
          type: messagePart.image.type,
          data: messagePart.image.data,
          media_type: messagePart.image.mimeType,
        },
      } as Anthropic.Messages.ImageBlockParam;

    if (messagePart.type === "tool_call")
      return {
        type: "tool_use",
        id: messagePart.toolCallId,
        name: messagePart.toolName,
        input: messagePart.toolArgs,
      } as Anthropic.Messages.ToolUseBlockParam;

    if (messagePart.type === "tool_response")
      return {
        type: "tool_result",
        tool_use_id: messagePart.toolCallId,
        output: messagePart.toolOutput,
      } as Anthropic.Messages.ToolResultBlockParam;

    never(messagePart);
  }

  // #endregion
}

export const runner = AnthropicRunner.new();
