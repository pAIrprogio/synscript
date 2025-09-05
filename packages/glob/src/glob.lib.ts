import { glob as globAsync, globSync, type GlobOptions } from "glob";
import { minimatch } from "minimatch";

interface Options {
  includes: string[];
  excludes?: string[];
}

/**
 * Ensures a glob pattern has a trailing slash to match directories only
 * @param glob - The glob pattern to ensure has a trailing slash
 * @returns The glob pattern with a trailing slash
 */
export function ensureDirTrailingSlash(glob: string) {
  return glob.endsWith("/") ? glob : `${glob}/`;
}

/**
 * Allows extracting values from a glob pattern
 * @example **\/path/to/(*)/(*).ts => [string, string]
 * @returns string[] or null if glob does not match
 *
 * _Note: glob capturing only works with single "*" widlcards_
 */
export function capture(glob: string, filePath: string) {
  const baseRegex = minimatch.makeRe(glob);
  if (!baseRegex) throw new InvalidGlobException(glob);
  const capturingRegexString = baseRegex.source
    .replaceAll("\\(", "(")
    .replaceAll("\\)", ")")
    .replaceAll("\\\\", "\\");
  const regex = new RegExp(capturingRegexString, "g");
  const matches = regex.exec(filePath);
  if (!matches) return null;
  return matches.slice(1);
}

function flatten(array: Array<string> | [Array<string>]): Array<string> {
  return Array.isArray(array[0]) ? array[0] : (array as Array<string>);
}

/**
 * @param filePath
 * @param globs list of globs to match against globs prefixed with ! are excluded
 * @returns boolean
 */
export function matches(
  filePath: string,
  ...globs: Array<string> | [Array<string>]
): boolean {
  const { includes, excludes } = sort(...globs);
  return (
    includes.some((globPattern) => minimatch(filePath, globPattern)) &&
    !excludes.some((glob) => minimatch(filePath, glob, { dot: true }))
  );
}

/**
 * Split included and excluded globs, removing the "!" prefix along the way
 * @param patterns a list of glob patterns, excluded globs start with "!"
 */
export function sort(...patterns: Array<string> | [Array<string>]) {
  const _patterns = flatten(patterns);
  const includes = _patterns.filter((glob) => !glob.startsWith("!"));
  const excludes = _patterns
    .filter((glob) => glob.startsWith("!"))
    .map((glob) => glob.replace("!", ""));
  return { includes, excludes };
}

/**
 * Create a filter function resolving to true if path matches any of the globs
 * @param patterns A list of glob patterns
 */
export function filterIncludedFactory(
  ...patterns: Array<string> | [Array<string>]
) {
  return (path: string) =>
    flatten(patterns).some((glob) => minimatch(path, glob, { dot: true }));
}

/**
 * Create a filter function resolving to true as long as path doesn't match any of the globs
 * @param patterns A list of glob patterns
 */
export function filterExcludedFactory(
  ...patterns: Array<string> | [Array<string>]
) {
  return (path: string) =>
    flatten(patterns).every((glob) => !minimatch(path, glob, { dot: true }));
}

/**
 * Creates a filter function based on glob patterns or GlobOptions
 * @param options Array of glob patterns with excluded patterns prefixed with "!" or an object of sorted glob patterns
 * @returns A function that takes a path and returns true if it matches the glob patterns and none of the excluded patterns
 */
export function filterFactory(globs: Array<string>): (path: string) => boolean;
export function filterFactory(options: Options): (path: string) => boolean;
export function filterFactory(options: Options | Array<string>) {
  const _options = options instanceof Array ? sort(...options) : options;
  const filterIncluded = filterIncludedFactory(_options.includes ?? []);
  const filterExcluded = filterExcludedFactory(_options.excludes ?? []);
  return (path: string) => filterIncluded(path) && filterExcluded(path);
}

export class Glob {
  public static cwd(this: void, cwd: string) {
    return new Glob(cwd);
  }

  private readonly _cwd: string;
  private readonly _options: GlobOptions;

  protected constructor(
    cwd: string = ".",
    options: GlobOptions = {
      nodir: true,
    },
  ) {
    this._cwd = cwd;
    this._options = options;
  }

  /**
   * Set advanced options for the glob search
   * @param options GlobOptions
   * @returns A new Glob instance with the updated options
   */
  public options(options: GlobOptions) {
    return new Glob(this._cwd, options);
  }

  /**
   * Executes a glob search and return the matching files
   */
  public find(...patterns: Array<string> | [Array<string>]) {
    const _patterns = flatten(patterns);
    const { includes, excludes } = sort(_patterns);
    return globAsync(includes, {
      ignore: excludes,
      nodir: this._options.nodir ?? true,
      cwd: this._cwd,
      ...this._options,
    }) as Promise<string[]>;
  }

  /**
   * Synchronously executes a glob search and return the matching files
   */
  public findSync(...patterns: Array<string> | [Array<string>]) {
    const _patterns = flatten(patterns);
    const { includes, excludes } = sort(_patterns);
    return globSync(includes, {
      ignore: excludes,
      nodir: this._options.nodir ?? true,
      cwd: this._cwd,
      ...this._options,
    }) as string[];
  }
}

export class InvalidGlobException extends Error {
  constructor(glob: string) {
    super(`Invalid glob: ${glob}`);
  }
}

/**
 * Creates a Glob instance with the provided working directory
 * @param cwd Path to the working directory, defaults to the current working directory
 */
export const cwd = Glob.cwd;
