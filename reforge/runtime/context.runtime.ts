import { file, files, reforge } from "@synstack/synscript";
import { FsFile, type FsFileArray } from "@synstack/synscript/fs";

export async function getRuntimeContext() {
  const [focusedFilePath, openedFilesPaths] = await Promise.all([
    reforge.getFocusedFile(),
    reforge.getOpenedFiles(),
  ]);

  return {
    focusedFile: focusedFilePath ? file(focusedFilePath) : null,
    openedFiles: files(openedFilesPaths).filter(
      (f) => f.path !== focusedFilePath,
    ),
  };
}

export interface BaseContext {
  focusedFile: FsFile;
  openedFiles: FsFileArray;
}
