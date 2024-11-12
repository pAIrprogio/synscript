import { file, FsFile } from "../../packages/fs/src/file.lib";
import { files, FsFileArray } from "../../packages/fs/src/files-array.lib";
import * as reforge from "../../packages/reforge/src/reforge.bundle";

export async function getRuntimeContext() {
  const [focusedFile, openedFiles] = await Promise.all([
    reforge.getTargetFile(),
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
