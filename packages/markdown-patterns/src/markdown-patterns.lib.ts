import type { FsDir, FsFile } from "@synstack/fs";
import { md } from "@synstack/markdown";
import { t } from "@synstack/text";
import z from "zod/v4";

export const NAME_SEPARATOR = "/";

export function getPatternName(patternDir: FsDir, patternFile: FsFile) {
  const relativePath = patternFile.dir().relativePathFrom(patternDir);
  const dirPath = relativePath.split("/");
  const lastFolderName = dirPath.pop();
  let fileName = patternFile.fileNameWithoutExtension();

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

export async function getPatterns<CONFIG_SCHEMA extends z.ZodObject<any>>(
  cwd: FsDir,
  configSchema: CONFIG_SCHEMA,
  glob: string = "**/*.md",
) {
  const patternFiles = await cwd
    .glob(glob)
    // Sort by path
    .then((files) =>
      files.sort((a, b) =>
        a.relativePathFrom(cwd).localeCompare(b.relativePathFrom(cwd)),
      ),
    );
  return Promise.all(
    patternFiles.map(async (patternFile) => {
      // Read the pattern file
      const mdContent = await patternFile.read.text();
      const data = await new Promise((resolve) =>
        resolve(md.getHeaderData(mdContent)),
      ).catch(async (err) => {
        throw new Error(
          `Failed to read pattern file header ${cwd.relativePathTo(patternFile)}: ${err.message}`,
        );
      });
      const content = md.getBody(mdContent).trim();
      const parsedData = configSchema.safeParse(data);

      if (!parsedData.success)
        throw new Error(t`
          Failed to parse config for ${cwd.relativePathTo(patternFile)}:
            ${z.prettifyError(parsedData.error)}
        `);

      // Compute the pattern name
      const { name, type } = getPatternName(cwd, patternFile);

      return {
        $name: name,
        $type: type,
        $content: content.length > 0 ? content : null,
        $file: patternFile,
        ...parsedData.data,
      };
    }),
  );
}
