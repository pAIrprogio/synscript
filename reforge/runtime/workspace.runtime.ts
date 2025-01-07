import { dir } from "@synstack/synscript";
import { FsFile } from "@synstack/synscript/fs";

export const rootDir = dir(import.meta.dirname).to("../../");
export const reforgeDir = rootDir.to("reforge");

export const autoDir = (file: FsFile) => {
  if (file.isInDir(reforgeDir)) return reforgeDir;
};
