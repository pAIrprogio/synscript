import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import type { ZodTypeDef as ZodTypeDefV3, ZodType as ZodTypeV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod/v4";

// Union type to support both Zod v3 and v4 schemas
type ZodSchema<OUT = any, IN = any> =
  | ZodTypeV3<OUT, ZodTypeDefV3, IN>
  | ZodTypeV4<OUT, IN>;

/**
 * Retrieves an URL as JSON
 * @param url
 * @param options.schema an optional Zod schema to validate the data against
 * @returns the JSON as a JS object
 */
export const fetchJson = <SHAPE>(
  url: string,
  options: { schema?: ZodSchema<SHAPE> } = {},
): Promise<SHAPE> =>
  fetch(url)
    .then((response) => response.json())
    .then((data) => (options.schema ? options.schema.parse(data) : data));

/**
 * Retrieves an URL as a string
 * @param url
 * @returns the plain text content of the URL
 */
export const fetchText = (url: string): Promise<string> =>
  fetch(url).then((response) => response.text());

/**
 * Extract an article from a URL
 * @param url
 * @returns the article content as a JS object
 */
export const fetchArticle = async (url: string) => {
  const content = await fetchText(url);
  const doc = parseHTML(content, { url });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  if (!article?.content) throw new ArticleNotFoundException(url);

  return {
    url,
    content: article.content,
    title: article.title,
    byline: article.byline,
    siteName: article.siteName,
    lang: article.lang,
    publishedTime: article.publishedTime,
  };
};

export class ArticleNotFoundException extends Error {
  constructor(url: string) {
    super(
      `
No article found at the URL
URL: ${url}
`.trim(),
    );
  }
}
