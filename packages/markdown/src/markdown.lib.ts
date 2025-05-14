import { yaml } from "@synstack/yaml";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import TurndownService from "turndown";
import { unified } from "unified";
import type { ZodSchema } from "zod";
import { type Stringable } from "../../shared/src/ts.utils.ts";

/**
 * Convert HTML to markdown
 * @param html - The HTML to convert
 * @returns The markdown
 */
export const fromHtml = (html: Stringable) => {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    fence: "```",
    hr: "***",
    linkStyle: "inlined",
    strongDelimiter: "__",
  });
  return turndown.turndown(html.toString());
};

const HEADER_REGEX = /^---\n([\s\S]*?)\n---\n/;

/**
 * Get the header data from a markdown document
 * @param text - The markdown document
 * @param options - The options (optional)
 * @param options.schema - The schema to use for deserialization (optional)
 * @returns The header data
 */
export const getHeaderData = <TFormat = any>(
  text: Stringable,
  { schema }: { schema?: ZodSchema<TFormat> } = {},
): TFormat | undefined => {
  const header = text.toString().match(HEADER_REGEX)?.[1];
  if (!header) return undefined;
  return yaml.deserialize(header, { schema });
};

/**
 * Set the header data in a markdown document while preserving the body
 * @param text - The markdown document
 * @param data - The data to set
 * @param options - The options (optional)
 * @param options.schema - The schema to use for serialization (optional)
 * @returns The markdown document with the header data set
 */
export const setHeaderData = <TFormat = any>(
  text: Stringable,
  data: TFormat,
  options: { schema?: ZodSchema<TFormat> } = {},
) => {
  return `---\n${yaml.serialize(data, { schema: options.schema })}---\n${getBody(text.toString())}`;
};

/**
 * Get the body of a markdown document
 * @param text - The markdown document
 * @returns The body as a string
 */
export const getBody = (text: string) => {
  return text.replace(HEADER_REGEX, "");
};

/**
 * Set the body of a markdown document while preserving the header
 * @param text - The markdown document
 * @param body - The body to set
 * @returns The markdown document with the body set
 */
export const setBody = (text: string, body: string) => {
  const header = text.match(HEADER_REGEX)?.[0];
  return `${header ?? ""}${body}`;
};

/**
 * Minify a markdown document
 * @param text - The markdown document
 * @returns The minified markdown document
 */
export const minify = (md: string) => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm, {
      firstLineBlank: false,
      singleTilde: false,
      tableCellPadding: false,
      tablePipeAlign: false,
    })
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkStringify, {
      bullet: "*",
      bulletOther: "-",
      bulletOrdered: ".",
      listItemIndent: "one",
      fence: "`",
      fences: true,
      rule: "-",
      ruleRepetition: 3,
      ruleSpaces: false,
      closeAtx: false,
      emphasis: "_",
      strong: "_",
      setext: false,
      quote: '"',
      resourceLink: false,
      tightDefinitions: true,
    })
    .processSync(md)
    .toString();
};

// Todo: add docs
export class MdDoc<
  TShape = never,
  TData extends TShape | undefined = never,
  TBody extends string | undefined = undefined,
> {
  private readonly _body: TBody;
  private readonly _data: TData;
  private readonly _options: { schema?: ZodSchema<TShape> };

  private constructor(
    data: TData,
    body: TBody,
    options: { schema?: ZodSchema<TShape> } = {},
  ) {
    this._body = body;
    this._data = data;
    this._options = options ?? {};
  }

  public static withOptions<TShape = any>(
    this: void,
    options: { schema?: ZodSchema<TShape> },
  ) {
    return new MdDoc<TShape, undefined, undefined>(
      undefined,
      undefined,
      options,
    );
  }

  public static fromString<TShape = unknown>(this: void, text: string) {
    return new MdDoc<TShape, TShape, string>(
      getHeaderData(text) as TShape,
      getBody(text),
    );
  }

  public static fromHtml<TShape = unknown>(this: void, html: string) {
    return new MdDoc<TShape, undefined, string>(undefined, fromHtml(html));
  }

  public get body(): string {
    return this._body ?? "";
  }

  public get data(): TData {
    return this._data;
  }

  public get header(): string {
    return this._data ? `---\n${yaml.serialize(this._data)}---\n` : "";
  }

  public get options(): { schema?: ZodSchema<TShape> } {
    return this._options;
  }

  public fromString(text: string) {
    const validatedData = getHeaderData<TShape>(text, {
      schema: this._options.schema,
    }) as TShape;
    return new MdDoc<TShape, TShape, string>(
      validatedData,
      getBody(text),
      this._options,
    );
  }

  public fromHtml(html: string) {
    return new MdDoc(this._data, fromHtml(html), this._options);
  }

  public setData(data: TShape) {
    const validatedData = this._options.schema
      ? this._options.schema.parse(data)
      : data;
    return new MdDoc(validatedData, this._body, this._options);
  }

  public setBody(text: string) {
    return new MdDoc(this._data, text, this._options);
  }

  public minify() {
    return new MdDoc(this._data, minify(this.toString()), this._options);
  }

  public toMd() {
    return this.toString();
  }

  public toString() {
    return `${this.header}${this.body}`;
  }
}
