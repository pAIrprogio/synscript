import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { type ZodSchema } from "zod";

export const fetchJson = <T>(
  url: string,
  options: { schema?: ZodSchema<T> } = {},
): Promise<T> =>
  fetch(url)
    .then((response) => response.json())
    .then((data) => (options.schema ? options.schema.parse(data) : data));

export const fetchText = (url: string): Promise<string> =>
  fetch(url).then((response) => response.text());

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
No article found in the content
URL: ${url}
`.trim(),
    );
  }
}

export const web = {
  fetchJson,
  fetchText,
  fetchArticle,
};

export default web;
