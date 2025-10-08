import { execPipe, filter, flatMap } from "iter-tools-es";

function importExeca() {
  return import("execa").catch((error) => {
    throw new Error(
      "The `execa` package is not installed. Please install it first.",
      { cause: error },
    );
  });
}

/**
 * Lists all files in a Git repository, including tracked, modified, and untracked files.
 * Respects .gitignore rules.
 *
 * @param cwd - The working directory to execute the git command from
 * @returns A sorted array of file paths
 *
 * @example
 * ```ts
 * const files = await ls('./my-repo')
 * // ['index.ts', 'lib.ts', ...]
 * ```
 */
export async function ls(cwd: string = ".") {
  const { execa } = await importExeca();
  const [trackedFiles, modifiedFiles, untrackedFiles] = await Promise.all([
    execa({
      cwd: cwd,
    })`git ls-files`,
    execa({
      cwd: cwd,
    })`git ls-files -m`,
    execa({
      cwd: cwd,
    })`git ls-files --others --exclude-standard`,
  ]);

  const files = execPipe(
    [trackedFiles, modifiedFiles, untrackedFiles],
    flatMap((r) => r.stdout.split(/\r?\n/)),
    filter((l) => l.trim().length > 0),
  );

  return [...new Set(files)].sort();
}

/**
 * Shows the details of a specific Git commit, including the commit message and changes.
 *
 * @param commitId - The hash of the commit to show
 * @param cwd - The working directory to execute the git command from
 * @returns The commit details as a string
 *
 * @example
 * ```ts
 * const commit = await show('449b7730436026243936a0a2f37c6d3474fcad3b')
 * // Returns commit message and changes
 * ```
 */
export async function show(commitId: string, cwd: string = ".") {
  const { execa } = await importExeca();
  const res = await execa({
    cwd: cwd,
  })`git show ${commitId}`;
  return res.stdout.trim();
}
