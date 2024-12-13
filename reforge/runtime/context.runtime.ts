import { file, files, reforge } from "@synstack/synscript";
import { FsFile, type FsFileArray } from "@synstack/synscript/fs";

export async function getRuntimeContext() {
  const [focusedFile, openedFiles] = await Promise.all([
    reforge.getFocusedFile(),
    reforge.getOpenedFiles(),
  ]);

  return {
    focusedFile: focusedFile ? file(focusedFile) : null,
    openedFiles: files(openedFiles),
  };
}

export interface BaseContext {
  focusedFile: FsFile;
  openedFiles: FsFileArray;
}
