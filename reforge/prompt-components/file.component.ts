import { t, tIf } from "@synstack/synscript";
import { FsDir, FsFile } from "@synstack/synscript/fs";

export async function fileToPrompt(
  file: FsFile,
  baseDir?: FsDir,
  source?: string,
) {
  const content = await file.read.text();
  const path = baseDir ? file.relativePathFrom(baseDir) : file.path;

  if (!content) return "";

  return t`
    <file path="${path}"${tIf(source)` source="${source}"`}>
      ${content}
    </file>
  `;
}
