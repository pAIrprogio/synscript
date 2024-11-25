import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
  ChatCompletionUserMessageParam,
} from "openai/resources/index";
import { zodToJsonSchema } from "zod-to-json-schema";
import { never } from "../../../shared/src/ts.utils.ts";
import { type Llm } from "../llm.types.ts";

export type CompleteOpenAICompletion = Llm.Completion;

export class OpenAIUtils {
  public static readonly models = {
    GPT_3_5_TURBO: "gpt-3.5-turbo",
    GPT_4: "gpt-4",
    GPT_4_TURBO: "gpt-4-turbo",
    GPT_4O: "gpt-4o",
    GPT_4O_MINI: "gpt-4o-mini",
  };

  public static mapCompletionQuery(
    this: void,
    query: CompleteOpenAICompletion,
  ) {
    const systemMessages = OpenAIUtils.systemMessages(query.system);
    const messages = query.messages.map(OpenAIUtils.mapMessage);

    return {
      // Todo: repair
      model: "query.model",
      max_tokens: query.maxTokens,
      temperature: query.temperature,
      messages: [...systemMessages, ...messages],
      tools: OpenAIUtils.tools(query.toolsConfig),
      tool_choice: OpenAIUtils.toolChoice(query.toolsConfig),
    } satisfies ChatCompletionCreateParamsNonStreaming;
  }

  private static systemMessages(instructions?: string) {
    if (!instructions) return [];
    return [
      {
        role: "system" as const,
        content: instructions,
      },
    ];
  }

  private static tools(
    toolsConfig?: Llm.Completion.ToolConfig,
  ): Array<ChatCompletionTool> | undefined {
    if (toolsConfig === undefined) return undefined;
    if (toolsConfig.type === "multi")
      return toolsConfig.tools.map(OpenAIUtils.mapTool);
    if (toolsConfig.type === "single")
      return [OpenAIUtils.mapTool(toolsConfig.tool)];
    never(toolsConfig);
  }

  private static toolChoice(
    toolsConfig?: Llm.Completion.ToolConfig,
  ): ChatCompletionToolChoiceOption {
    if (toolsConfig === undefined) return "none";

    if (toolsConfig.type === "single")
      return {
        type: "function",
        function: {
          name: toolsConfig.tool.name,
        },
      };

    if (toolsConfig.requireToolUse) return "required";
    return "none";
  }

  private static mapTool(
    this: void,
    functionCall: Llm.Tool,
  ): ChatCompletionTool {
    const schema = zodToJsonSchema(functionCall.schema);
    delete schema.$schema;

    return {
      type: "function",
      function: {
        name: functionCall.name,
        description: functionCall.schema?.description,
        parameters: schema,
      },
    };
  }

  private static mapMessage(this: void, message: Llm.Message) {
    if (message.role === "assistant")
      return message as ChatCompletionAssistantMessageParam;
    if (message.role === "user")
      return {
        role: "user",
        content: message.content.map(OpenAIUtils.mapMessageContent),
      } as ChatCompletionUserMessageParam;
    throw new Error("Unknown message role");
  }

  private static mapMessageContent(
    this: void,
    messagePart: Llm.Message.Content,
  ) {
    if (messagePart.type === "text")
      return messagePart as ChatCompletionContentPartText;
    if (messagePart.type === "image")
      return {
        type: "image_url",
        image_url: {
          url: messagePart.image.data,
        },
      } as ChatCompletionContentPartImage;
    throw new Error("Unknown message content type");
  }
}
