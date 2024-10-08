import { execaCommand } from "execa";

export async function ls(cwd: string = ".", relativePath: string = ".") {
  const res = await execaCommand(
    `( git ls-files ${relativePath}; git ls-files -m ${relativePath} ; git ls-files --others --exclude-standard ${relativePath} ) | sort | uniq`,
    { cwd: cwd },
  );
  return res.stdout
    .trim()
    .split("\n")
    .filter((path) => path.length > 0);
}
