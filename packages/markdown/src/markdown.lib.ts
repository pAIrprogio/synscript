import { yaml } from "@synstack/yaml";
import TurndownService from "turndown";
import { ZodSchema } from "zod";

export const fromHtml = (html: string) => {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    fence: "```",
    hr: "***",
    linkStyle: "inlined",
    strongDelimiter: "__",
  });
  return turndown.turndown(html);
};

const HEADER_REGEX = /^---\n([\s\S]*?)\n---\n/;

export const getHeaderData = <TFormat = any>(
  text: string,
  { schema }: { schema?: ZodSchema<TFormat> } = {},
): TFormat | undefined => {
  const header = text.match(HEADER_REGEX)?.[1];
  if (!header) return undefined;
  return yaml.deserialize(header, { schema });
};

export const setHeaderData = <TFormat = any>(
  text: string,
  data: TFormat,
  options: { schema?: ZodSchema<TFormat> } = {},
) => {
  return `---\n${yaml.serialize(data, { schema: options.schema })}---\n${getBody(text)}`;
};

export const getBody = (text: string) => {
  return text.replace(HEADER_REGEX, "");
};

export const setBody = (text: string, body: string) => {
  const header = text.match(HEADER_REGEX)?.[0];
  return `${header ?? ""}${body}`;
};

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

  public toMd() {
    return this.toString();
  }

  public toString() {
    return `${this.header}${this.body}`;
  }
}
