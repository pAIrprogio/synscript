import type { FsDir, FsFile } from "@synstack/fs";
import { md } from "@synstack/markdown";
import { t } from "@synstack/text";
import z from "zod/v4";

export const NAME_SEPARATOR = "/";

export function getMarkdownEntryId(mdDir: FsDir, mdFile: FsFile) {
  const relativePath = mdFile.dir().relativePathFrom(mdDir);
  const dirPath = relativePath.split("/");
  const lastFolderName = dirPath.pop();
  let fileName = mdFile.fileNameWithoutExtension();

  // Remove numeric prefix (e.g., "0." from "0.buttons")
  fileName = fileName.replace(/^\d+\./, "");

  // Extract type suffix if present (e.g., "my-type" from "buttons.my-type")
  let type: string | null = null;
  const typeMatch = fileName.match(/^(.+)\.(.+)$/);
  if (typeMatch) {
    fileName = typeMatch[1];
    type = typeMatch[2];
  }

  // If the last folder's name is the same as the file name, we can skip it
  const nameParts =
    lastFolderName === fileName
      ? [...dirPath, fileName]
      : [...dirPath, lastFolderName, fileName];

  return {
    name: nameParts.filter((part) => part !== "").join(NAME_SEPARATOR),
    type,
  };
}

export async function getMarkdownEntries<
  CONFIG_SCHEMA extends z.ZodObject<any>,
>(
  cwd: FsDir,
  configSchema: CONFIG_SCHEMA,
  globs: [string, ...string[]] = ["**/*.md"],
) {
  const mdFiles = await cwd
    .glob(globs)
    // Sort by path
    .then((files) =>
      files.sort((a, b) =>
        a.relativePathFrom(cwd).localeCompare(b.relativePathFrom(cwd)),
      ),
    );
  return Promise.all(
    mdFiles.map(async (mdFile) => {
      // Read the md file
      const mdContent = await mdFile.read.text();
      const data = await new Promise((resolve) =>
        resolve(md.getHeaderData(mdContent)),
      ).catch(async (err) => {
        throw new Error(
          `Failed to read markdown file header ${cwd.relativePathTo(mdFile)}: ${err.message}`,
        );
      });
      const content = md.getBody(mdContent).trim();
      const parsedData = configSchema.safeParse(data);

      if (!parsedData.success)
        throw new Error(t`
          Failed to parse config for ${cwd.relativePathTo(mdFile)}:
            ${z.prettifyError(parsedData.error)}
        `);

      // Compute the entry id
      const { name, type } = getMarkdownEntryId(cwd, mdFile);

      return {
        $id: name,
        $type: type,
        $content: content.length > 0 ? content : null,
        $file: mdFile,
        ...parsedData.data,
      };
    }),
  );
}
