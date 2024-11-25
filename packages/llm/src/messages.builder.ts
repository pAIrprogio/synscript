import { enhance, type Enhanced } from "@synstack/enhance";
import { type Resolvable } from "@synstack/resolved";
import { type Llm } from "./llm.types.ts";

export interface MessagesMethods {
  last(this: MessagesArray): Resolvable<Llm.Message | undefined>;
  first(this: MessagesArray): Resolvable<Llm.Message | undefined>;
}

export const messagesExtraMethods: MessagesMethods = {
  last(this: MessagesArray) {
    const message = this.at(-1);
    if (!message) throw new Error("Empty messages array");
    return message;
  },
  first(this: MessagesArray) {
    const message = this.at(0);
    if (!message) throw new Error("Empty messages array");
    return message;
  },
};

export type MessagesArray = Enhanced<
  "arr",
  Array<Resolvable<Llm.Message>>,
  typeof messagesExtraMethods
>;

export const arr = (array: Array<any>): MessagesArray =>
  enhance("arr", array, messagesExtraMethods);
