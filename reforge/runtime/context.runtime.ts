import { file, FsFile } from "../../packages/fs/src/file.lib.ts";
import { files, FsFileArray } from "../../packages/fs/src/files-array.lib.ts";
import * as reforge from "../../packages/reforge/src/reforge.index.ts";

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
