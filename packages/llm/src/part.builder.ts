import mime from "mime-types";
import type { Llm } from "./llm.types.ts";

export const filePart = {
  fromPath(path: string, mimeType?: string) {
    const extractedMimeType = mimeType ?? mime.lookup(path);

    if (!extractedMimeType)
      throw new Error(
        `Mimetype cannot be inferred for file ${path}, provide it as a parameter instead`,
      );

    if (extractedMimeType.startsWith("image/"))
      return {
        type: "image",
        encoding: "path",
        mimeType,
        data: path,
      } as Llm.Message.Template.Part.Image;
    else
      return {
        type: "file",
        encoding: "path",
        mimeType,
        data: path,
      } as Llm.Message.Template.Part.File;
  },
  fromBase64(base64: string, mimeType?: string) {
    const extractedMimeType = mimeType ?? base64.match(/^data:([^;]+);/)?.[1];

    if (!extractedMimeType)
      throw new Error(
        `Mimetype cannot be inferred for base64 ${base64}, provide it as a parameter instead`,
      );

    if (extractedMimeType.startsWith("image/"))
      return {
        type: "image",
        encoding: "base64",
        mimeType,
        data: base64,
      } as Llm.Message.Template.Part.Image;
    else
      return {
        type: "file",
        encoding: "base64",
        mimeType,
        data: base64,
      } as Llm.Message.Template.Part.File;
  },
  fromUrl(url: string, mimeType?: string) {
    const extractedMimeType = mimeType ?? mime.lookup(url);

    if (!extractedMimeType)
      throw new Error(
        `Mimetype cannot be inferred for url ${url}, provide it as a parameter instead`,
      );

    return {
      type: extractedMimeType.startsWith("image/") ? "image" : "file",
      encoding: "url",
      mimeType,
      url,
    };
  },
};
