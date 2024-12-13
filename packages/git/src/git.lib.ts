import { execaCommand } from "execa";

/**
 * Lists all git-tracked, modified, and untracked files in a directory
 * @param cwd - Working directory for git commands (defaults to ".")
 * @param relativePath - Path relative to working directory to list files from (defaults to ".")
 * @returns Promise resolving to array of file paths
 *
 * This function combines the output of multiple git commands to list:
 * - Tracked files (git ls-files)
 * - Modified files (git ls-files -m)
 * - Untracked files (git ls-files --others --exclude-standard)
 *
 * Empty paths are filtered out from the results.
 */
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
