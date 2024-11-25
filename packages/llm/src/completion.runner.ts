import { type Resolvable } from "@synstack/resolved";
import { type Merge } from "../../shared/src/ts.utils.ts";
import { CompletionBuilder } from "./completion.builder.ts";
import { type Llm } from "./llm.types.ts";

export interface CompletionRunner<TCompletion extends Llm.Completion.Partial> {
  chatCompletion(
    completion: CompletionBuilder<Resolvable<TCompletion>>,
  ): Promise<{
    message: Llm.Assistant.Message;
    usage: Llm.Completion.Usage;
    stopReason: Llm.Completion.StopReason;
  }>;

  runChatCompletion<T extends TCompletion>(
    completion: CompletionBuilder<Resolvable<T>>,
  ): Promise<CompletionBuilder<Merge<T, Llm.Completion.Response.Part>>>;
}
