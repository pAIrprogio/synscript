import { yaml } from "@synstack/yaml";
import type { Options as StringifyOptions } from "mdast-util-to-markdown";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm, { type Options as GfmOptions } from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";
import { type Stringable } from "../../shared/src/ts.utils.ts";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

const beautifiedConfig = {
  gfm: {
    firstLineBlank: true,
    singleTilde: false,
    tableCellPadding: true,
    tablePipeAlign: true,
  } satisfies GfmOptions,
  stringify: {
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
    resourceLink: true,
    tightDefinitions: false,
  } satisfies StringifyOptions,
};

const minifiedConfig = {
  gfm: {
    firstLineBlank: false,
    singleTilde: false,
    tableCellPadding: false,
    tablePipeAlign: false,
  } satisfies GfmOptions,
  stringify: {
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
  } satisfies StringifyOptions,
};

/**
 * Convert HTML to markdown
 * @param html - The HTML to convert
 * @returns The markdown (minified for LLM processing)
 */
export const fromHtml = (html: Stringable) => {
  return unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkGfm, minifiedConfig.gfm)
    .use(remarkStringify, minifiedConfig.stringify)
    .processSync(html.toString())
    .toString()
    .trim();
};

const HEADER_REGEX = /^--- *\n([\s\S]*?)\n--- *\n?/;

/**
 * Get the header data from a markdown document
 * @param text - The markdown document
 * @param options - The options (optional)
 * @param options.schema - The schema to use for deserialization (optional)
 * @returns The header data
 */
export const getHeaderData = <SHAPE = unknown>(
  text: Stringable,
  { schema }: { schema?: ZodSchema<SHAPE> } = {},
): SHAPE | undefined => {
  const header = text.toString().match(HEADER_REGEX)?.[1];
  if (!header && !schema) return undefined;
  if (!header && schema) return schema.parse(undefined);
  return yaml.deserialize(header ?? "", { schema });
};

/**
 * Set the header data in a markdown document while preserving the body
 * @param text - The markdown document
 * @param data - The data to set
 * @param options - The options (optional)
 * @param options.schema - The schema to use for serialization (optional)
 * @returns The markdown document with the header data set
 */
export const setHeaderData = <SHAPE = any>(
  text: Stringable,
  data: SHAPE,
  options: { schema?: ZodSchema<any, SHAPE> } = {},
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
 * Minify a markdown document for better LLM processing
 * @param text - The markdown document
 * @returns The minified markdown document
 */
export const minify = (md: string) => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm, minifiedConfig.gfm)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkStringify, minifiedConfig.stringify)
    .processSync(md)
    .toString()
    .trim();
};

/**
 * Beautify a markdown document for better human readability
 * @param md - The markdown document
 * @returns The beautified markdown document
 */
export const beautify = (md: string) => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm, beautifiedConfig.gfm)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkStringify, beautifiedConfig.stringify)
    .processSync(md)
    .toString();
};

/**
 * Markdown document instance
 */
export class MdDoc<SHAPE = never, DATA extends SHAPE | undefined = never> {
  private readonly _body: string;
  private readonly _data: DATA;
  private readonly _options: { schema?: ZodSchema<SHAPE> };

  private constructor(
    data: DATA,
    body: string,
    options: { schema?: ZodSchema<SHAPE, SHAPE> } = {},
  ) {
    this._body = body;
    this._data = data;
    this._options = options ?? {};
  }

  /**
   * Create a new markdown document with options
   * @param options
   * @param options.schema - The zod schema to use for serialization/deserialization (optional)
   * @returns A new markdown document instance
   */
  public static withOptions<SHAPE = unknown>(
    this: void,
    options: { schema?: ZodSchema<SHAPE, SHAPE> },
  ) {
    return new MdDoc<SHAPE, undefined>(undefined, "", options);
  }

  /**
   * Create a new markdown document from a string
   * @param text - The markdown document
   * @returns The markdown document
   */
  public static fromString<SHAPE = unknown>(this: void, text: string) {
    return new MdDoc<SHAPE, SHAPE>(getHeaderData(text) as SHAPE, getBody(text));
  }

  /**
   * Create a new markdown document from HTML
   * @param html - The HTML to convert
   * @returns The markdown document
   */
  public static fromHtml<SHAPE = unknown>(this: void, html: string) {
    return new MdDoc<SHAPE, undefined>(undefined, fromHtml(html));
  }

  /**
   * Get the body of the markdown document
   * @returns The body of the markdown document
   */
  public get body(): string {
    return this._body;
  }

  /**
   * Get the data of the markdown document
   * @returns The data of the markdown document
   */
  public get data(): DATA {
    return this._data;
  }

  /**
   * Get the header of the markdown document
   * @returns The header of the markdown document
   */
  public get header(): string {
    return this._data ? `---\n${yaml.serialize(this._data)}---\n` : "";
  }

  /**
   * Get the options of the markdown document
   * @returns The options of the markdown document
   */
  public get options(): { schema?: ZodSchema<SHAPE, SHAPE> } {
    return this._options;
  }

  /**
   * Create a new markdown document from a string
   * @param text - The markdown document
   * @returns A new markdown document
   */
  public fromString(text: string) {
    const validatedData = getHeaderData<SHAPE>(text, {
      schema: this._options.schema,
    })!;
    return new MdDoc<SHAPE, SHAPE>(validatedData, getBody(text), this._options);
  }

  /**
   * Create a new markdown document from HTML
   * @param html - The HTML to convert
   * @returns A new markdown document
   */
  public fromHtml(html: string) {
    return new MdDoc(this._data, fromHtml(html), this._options);
  }

  /**
   * Set the data of the markdown document
   * @param data - The data to set
   * @returns A new markdown document
   */
  public setData(data: SHAPE) {
    const validatedData = this._options.schema
      ? this._options.schema.parse(data)
      : data;
    return new MdDoc(validatedData, this._body, this._options);
  }

  /**
   * Set the body of the markdown document
   * @param text - The body to set
   * @returns A new markdown document
   */
  public setBody(text: string) {
    return new MdDoc(this._data, text, this._options);
  }

  /**
   * Minify the markdown document for better LLM processing
   * @returns A new markdown document
   */
  public minify() {
    return new MdDoc(this._data, minify(this.body), this._options);
  }

  /**
   * Beautify the markdown document for better human readability
   * @returns A new markdown document
   */
  public beautify() {
    return new MdDoc(this._data, beautify(this.body), this._options);
  }

  /**
   * Get the markdown document as a string
   *
   * @alias {@link toString}
   * @returns The markdown document as a string
   */
  public toMd() {
    return this.toString();
  }

  /**
   * Get the markdown document as a string
   * @returns The markdown document as a string
   */
  public toString() {
    return `${this.header}${this.body}`;
  }
}
