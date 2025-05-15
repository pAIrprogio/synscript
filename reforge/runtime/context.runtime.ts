import { FsFile, file, files, type FsFileArray } from "@synstack/fs";
import { reforge } from "@synstack/reforge";

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
