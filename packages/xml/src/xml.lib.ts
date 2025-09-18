import { produce } from "immer";
import { type Stringable } from "../../shared/src/ts.utils.ts";

type XmlPart =
  | { type: "text"; text: string }
  | {
      type: "tagOpen";
      name: string;
      text: string;
      attrs: { [key: string]: string };
    }
  | {
      type: "tagClose";
      name: string;
      text: string;
    }
  | {
      type: "tagSelfClose";
      name: string;
      text: string;
      attrs: { [key: string]: string };
    };

export const xmlOpeningTagRegex =
  /<([a-zA-Z][a-zA-Z0-9_:-]*)((?:\s+[a-zA-Z][a-zA-Z0-9_:-]*="[^"]*")*)\s*(\/?)>/;

export const xmlClosingTagRegex = /<\/([a-zA-Z_][a-zA-Z0-9_:-]*)>/;

export const xmlAttributeRegex = /([a-zA-Z][a-zA-Z0-9_:-]*)="([^"]*)"/g;

export const parseAttributes = (attributes: string) => {
  const matches = [...attributes.matchAll(xmlAttributeRegex)];
  return Object.fromEntries(
    matches.map((match) => {
      const [_text, attributeName, attributeValue] = match;
      return [attributeName, attributeValue];
    }),
  );
};

export const splitXmlTags = (content: string): Array<XmlPart> => {
  const parts: XmlPart[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    const openMatch = remaining.match(xmlOpeningTagRegex);
    const closeMatch = remaining.match(xmlClosingTagRegex);

    if (!openMatch && !closeMatch) {
      parts.push({
        type: "text",
        text: remaining,
      });
      break;
    }

    if (
      (!openMatch && closeMatch) ||
      (openMatch &&
        closeMatch &&
        (closeMatch.index ?? 0) < (openMatch.index ?? 0))
    ) {
      const [text, tagName] = closeMatch;
      const startIndex = closeMatch.index ?? 0;
      const prefix = remaining.slice(0, startIndex);
      if (prefix.length > 0)
        parts.push({
          type: "text",
          text: prefix,
        });
      parts.push({
        type: "tagClose",
        name: tagName,
        text: text,
      } as XmlPart);
      remaining = remaining.slice(startIndex + text.length);
    } else if (openMatch) {
      const [text, tagName, attributes, selfClosing] = openMatch;
      const startIndex = openMatch.index ?? 0;
      const prefix = remaining.slice(0, startIndex);
      if (prefix.length > 0)
        parts.push({
          type: "text",
          text: prefix,
        });
      parts.push({
        type: selfClosing ? "tagSelfClose" : "tagOpen",
        name: tagName,
        text: text,
        attrs: parseAttributes(attributes),
      } as XmlPart);
      remaining = remaining.slice(startIndex + text.length);
    }
  }

  return parts;
};

export declare namespace Xml {
  export type Node = Xml.Node.Text | Xml.Node.Tag;
  export namespace Node {
    export interface Text {
      type: "text";
      text: string;
    }

    export interface Tag {
      type: "tag";
      tag: string;
      attrs?: { [key: string]: string };
      content: Array<Text | Tag>;
      text: string;
    }
  }
}

interface XmlState {
  chunks: Array<Xml.Node>;
  stack: Array<Xml.Node.Tag>;
}

const buildXmlTree = (parts: Array<XmlPart>) => {
  const reducer = (state: XmlState, part: XmlPart) => {
    const res = produce(state, (draft) => {
      let lastNode = draft.stack.at(-1);
      let lastContents = lastNode?.content ?? draft.chunks;

      const updateStackText = (text: string) =>
        (draft.stack = draft.stack.map((node) => ({
          ...node,
          text: node.text + text,
        })));

      if (part.type === "text") {
        updateStackText(part.text);

        lastContents.push({
          type: "text" as const,
          text: part.text,
        });
        return;
      }

      if (part.type === "tagSelfClose") {
        updateStackText(part.text);
        lastContents.push({
          type: "tag" as const,
          tag: part.name,
          attrs: part.attrs,
          text: part.text,
          content: [],
        });
        return;
      }

      if (part.type === "tagOpen") {
        updateStackText(part.text);
        const node = {
          type: "tag" as const,
          tag: part.name,
          attrs: part.attrs,
          text: part.text,
          content: [],
        };
        draft.stack.push(node);
        return;
      }

      if (part.type === "tagClose") {
        // If we have no open tags, treat the closing tag as text
        if (draft.stack.length === 0) {
          lastContents.push({
            type: "text" as const,
            text: part.text,
          });
          return;
        }

        let foundMatchingTag = false;
        const tempStack: Array<Xml.Node.Tag> = [];

        // Look for matching tag in the stack
        while (draft.stack.length > 0) {
          const node = draft.stack.pop()!;
          if (node.tag === part.name) {
            foundMatchingTag = true;
            updateStackText(part.text);

            // If we have mismatched tags in between, convert them to a single text node
            if (tempStack.length > 0) {
              const textContent = tempStack
                .reverse()
                .map((n) => n.text)
                .join("");
              node.content.push({
                type: "text" as const,
                text: textContent,
              });
            }

            lastNode = draft.stack.at(-1);
            lastContents = lastNode?.content ?? draft.chunks;
            lastContents.push({
              ...node,
              text: node.text + part.text,
            });
            break;
          }
          tempStack.push(node);
        }

        // If no matching tag was found, treat everything as text
        if (!foundMatchingTag) {
          // Restore the stack
          while (tempStack.length > 0) {
            draft.stack.push(tempStack.pop()!);
          }
          // Add the closing tag as text
          updateStackText(part.text);
          lastContents.push({
            type: "text" as const,
            text: part.text,
          });
        }
        return;
      }
    });
    return res;
  };

  const { chunks, stack } = parts.reduce(reducer, {
    chunks: [],
    stack: [],
  });

  if (stack.length > 0) {
    // If we have any open tags left, treat them as text
    return [...chunks, { type: "text", text: stack.at(0)!.text }];
  }

  return chunks;
};

/**
 * A non-iso parser for XML
 *
 * - Preserves the original text order
 * - Adds invalid XML tags as text
 *
 * @param content The XML like content to parse
 * @returns The parsed XML as a tree of nodes
 */
export const parse = <T extends Array<Xml.Node>>(content: Stringable): T => {
  try {
    return buildXmlTree(splitXmlTags(content.toString().trim())) as T;
  } catch (error) {
    throw new Error(`Failed to parse XML`, {
      cause: error,
    });
  }
};

export const nodesToText = (nodes: Array<Xml.Node>) =>
  nodes.map((n) => n.text).join("");
