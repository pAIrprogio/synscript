import { Merge } from "@shared/src/ts.utils";
import { Resolvable } from "@synstack/resolved";
import { CompletionBuilder } from "./completion.builder";
import { Llm } from "./llm.types";

export interface CompletionRunner<TCompletion extends Llm.Completion.Partial> {
  chatCompletion(
    completion: CompletionBuilder<Resolvable<TCompletion>>,
  ): Promise<{
    message: Llm.Assistant.Message;
    usage: Llm.Usage;
    stopReason: Llm.StopReason;
  }>;

  runChatCompletion<T extends TCompletion>(
    completion: CompletionBuilder<Resolvable<T>>,
  ): Promise<CompletionBuilder<Merge<T, Llm.Completion.Response.Part>>>;
}
