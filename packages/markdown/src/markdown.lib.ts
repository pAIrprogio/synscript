import { yaml } from "@synstack/yaml";
import TurndownService from "turndown";
import { ZodSchema } from "zod";
import { type Stringable } from "../../shared/src/ts.utils.ts";

/**
 * Converts HTML content to Markdown format with consistent styling
 * @param html - HTML content to convert
 * @returns Markdown formatted string
 * @example
 * ```typescript
 * const markdown = fromHtml("<h1>Hello</h1>");
 * // Returns: "# Hello"
 * ```
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
 * Extracts and parses YAML frontmatter from markdown text
 * @param text - Markdown text with optional YAML frontmatter
 * @param options - Optional schema for validating frontmatter data
 * @returns Parsed frontmatter data or undefined if no frontmatter exists
 * @example
 * ```typescript
 * const data = getHeaderData("---\ntitle: Hello\n---\n# Content");
 * // Returns: { title: "Hello" }
 * ```
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
 * Sets YAML frontmatter in markdown text
 * @param text - Markdown text to update
 * @param data - Data to serialize as YAML frontmatter
 * @param options - Optional schema for validating frontmatter data
 * @returns Markdown text with updated frontmatter
 * @example
 * ```typescript
 * const text = setHeaderData("# Content", { title: "Hello" });
 * // Returns: "---\ntitle: Hello\n---\n# Content"
 * ```
 */
export const setHeaderData = <TFormat = any>(
  text: Stringable,
  data: TFormat,
  options: { schema?: ZodSchema<TFormat> } = {},
) => {
  return `---\n${yaml.serialize(data, { schema: options.schema })}---\n${getBody(text.toString())}`;
};

/**
 * Removes YAML frontmatter from markdown text
 * @param text - Markdown text with optional frontmatter
 * @returns Markdown text without frontmatter
 * @example
 * ```typescript
 * const body = getBody("---\ntitle: Hello\n---\n# Content");
 * // Returns: "# Content"
 * ```
 */
export const getBody = (text: string) => {
  return text.replace(HEADER_REGEX, "");
};

/**
 * Sets the body content of markdown text while preserving frontmatter
 * @param text - Original markdown text with optional frontmatter
 * @param body - New body content
 * @returns Updated markdown text with preserved frontmatter
 * @example
 * ```typescript
 * const text = setBody("---\ntitle: Hello\n---\nold", "new");
 * // Returns: "---\ntitle: Hello\n---\nnew"
 * ```
 */
export const setBody = (text: string, body: string) => {
  const header = text.match(HEADER_REGEX)?.[0];
  return `${header ?? ""}${body}`;
};

/**
 * Type-safe markdown document with optional YAML frontmatter
 * @template TShape - Shape of the frontmatter data
 * @template TData - Type of the current frontmatter data
 * @template TBody - Type of the current body content
 * @example
 * ```typescript
 * interface PostFrontmatter {
 *   title: string;
 *   date: string;
 * }
 *
 * const doc = MdDoc
 *   .withOptions({ schema: postSchema })
 *   .fromString("---\ntitle: Hello\ndate: 2024-01-01\n---\n# Content");
 * ```
 */
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

  /**
   * Creates a new MdDoc instance with validation options
   * @param options - Schema for validating frontmatter data
   * @returns Empty MdDoc instance with specified options
   */
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

  /**
   * Creates a new MdDoc from markdown text
   * @param text - Markdown text with optional frontmatter
   * @returns MdDoc instance with parsed frontmatter and body
   */
  public static fromString<TShape = unknown>(this: void, text: string) {
    return new MdDoc<TShape, TShape, string>(
      getHeaderData(text) as TShape,
      getBody(text),
    );
  }

  /**
   * Creates a new MdDoc from HTML content
   * @param html - HTML content to convert to markdown
   * @returns MdDoc instance with converted markdown body
   */
  public static fromHtml<TShape = unknown>(this: void, html: string) {
    return new MdDoc<TShape, undefined, string>(undefined, fromHtml(html));
  }

  /** Gets the markdown body content */
  public get body(): string {
    return this._body ?? "";
  }

  /** Gets the frontmatter data */
  public get data(): TData {
    return this._data;
  }

  /** Gets the serialized YAML frontmatter */
  public get header(): string {
    return this._data ? `---\n${yaml.serialize(this._data)}---\n` : "";
  }

  /** Gets the validation options */
  public get options(): { schema?: ZodSchema<TShape> } {
    return this._options;
  }

  /**
   * Creates a new MdDoc from markdown text using current options
   * @param text - Markdown text with optional frontmatter
   * @returns New MdDoc instance with parsed content
   */
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

  /**
   * Creates a new MdDoc from HTML content using current options
   * @param html - HTML content to convert
   * @returns New MdDoc instance with converted content
   */
  public fromHtml(html: string) {
    return new MdDoc(this._data, fromHtml(html), this._options);
  }

  /**
   * Updates frontmatter data with validation
   * @param data - New frontmatter data
   * @returns New MdDoc instance with updated data
   */
  public setData(data: TShape) {
    const validatedData = this._options.schema
      ? this._options.schema.parse(data)
      : data;
    return new MdDoc(validatedData, this._body, this._options);
  }

  /**
   * Updates markdown body content
   * @param text - New markdown content
   * @returns New MdDoc instance with updated body
   */
  public setBody(text: string) {
    return new MdDoc(this._data, text, this._options);
  }

  /** Alias for toString() */
  public toMd() {
    return this.toString();
  }

  /** Converts document to markdown string with frontmatter */
  public toString() {
    return `${this.header}${this.body}`;
  }
}
