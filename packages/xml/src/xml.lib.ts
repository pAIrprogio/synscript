import { produce } from "immer";

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
  /<([a-zA-Z_][a-zA-Z0-9_:-]*)((?:\s+[a-zA-Z_][a-zA-Z0-9_:-]*="[^"]*")*)\s*(\/?)>/;

export const xmlClosingTagRegex = /<\/([a-zA-Z_][a-zA-Z0-9_:-]*)>/;

export const xmlAttributeRegex = /([a-zA-Z_][a-zA-Z0-9_:-]*)="([^"]*)"/g;

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
  export type Node = Xml.Node.Text | Xml.Node.Object;
  export namespace Node {
    export interface Text {
      type: "text";
      text: string;
    }

    export interface Object {
      type: string;
      attrs?: { [key: string]: string };
      content: Array<Text | Object>;
      text: string;
    }
  }
}

interface XmlState {
  chunks: Array<Xml.Node>;
  stack: Array<Xml.Node.Object>;
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
        if (lastNode?.type === "text") {
          lastNode.text += part.text;
          return;
        }

        lastContents.push({
          type: "text",
          text: part.text,
        });
        return;
      }

      if (part.type === "tagSelfClose") {
        updateStackText(part.text);
        lastContents.push({
          type: part.name,
          attrs: part.attrs,
          text: part.text,
          content: [],
        });
        return;
      }

      if (part.type === "tagOpen") {
        updateStackText(part.text);
        const node = {
          type: part.name,
          attrs: part.attrs,
          text: part.text,
          content: [],
        };
        draft.stack.push(node);
        return;
      }

      if (part.type === "tagClose") {
        while (draft.stack.length >= 0) {
          const node = draft.stack.pop()!;
          lastNode = draft.stack.at(-1);
          lastContents = lastNode?.content ?? draft.chunks;

          // Handle last tag closing
          if (node.type === part.name) {
            updateStackText(part.text);
            lastContents.push({
              ...node,
              text: node.text + part.text,
            });
            return;
          }

          // Handle unclosed tag
          lastContents.push({
            type: "text",
            text: node.text,
          });
        }
        // Handle last tag closing here
        return;
      }
    });
    return res;
  };

  const { chunks, stack } = parts.reduce(reducer, {
    chunks: [],
    stack: [],
  });

  if (stack.length > 0)
    return [
      ...chunks,
      {
        type: "text",
        text: stack.at(0)!.text,
      },
    ];

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
export const parse = <T extends Array<Xml.Node>>(content: string): T =>
  buildXmlTree(splitXmlTags(content)) as T;
