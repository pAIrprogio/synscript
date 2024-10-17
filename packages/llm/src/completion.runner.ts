import { Merge } from "@shared/ts.utils";
import { Resolvable } from "@synstack/resolved";
import { CompletionBuilder } from "./completion.builder";
import { Llm } from "./llm.types";

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
