import type { FsDir, FsFile } from "@synstack/fs";
import { t } from "@synstack/text";

export async function fileToPrompt(
  file: FsFile,
  baseDir?: FsDir,
  source?: string,
) {
  const content = await file.read.text();
  const path = baseDir ? file.relativePathFrom(baseDir) : file.path;

  if (!content) return "";

  return t`
    <file path="${path}"${source && t` source="${source}"`}>
      ${content}
    </file>
  `;
}
