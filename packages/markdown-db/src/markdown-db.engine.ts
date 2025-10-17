import { type FsDir, type FsFile, fsFile } from "@synstack/fs";
import { glob } from "@synstack/glob";
import { md } from "@synstack/markdown";
import { QueryEngine } from "@synstack/query";
import { t } from "@synstack/text";
import { z } from "zod/v4";

type Globs = [string, ...string[]];

type Entry<CONFIG_SCHEMA extends MarkdownDb.Config.Base> = Awaited<
  ReturnType<MarkdownDb<any, CONFIG_SCHEMA>["readEntries"]>
>[number];

export const DEFAULT_NAME_SEPARATOR = "/";

export class MarkdownDb<
  INPUT = unknown,
  ENTRY_SCHEMA extends MarkdownDb.Config.Base = MarkdownDb.Config.Base,
  QUERY_SHAPE = any,
> {
  private _config: MarkdownDb.Config<INPUT, ENTRY_SCHEMA>;
  private _entriesPromise: Promise<Entry<ENTRY_SCHEMA>[]> | null = null;
  private _entriesMapPromise: Promise<Map<string, Entry<ENTRY_SCHEMA>>> | null =
    null;
  private _parentPatternsMapPromise: Promise<
    Map<string, Entry<ENTRY_SCHEMA>[]>
  > | null = null;
  private _cacheMap: Map<string, Entry<ENTRY_SCHEMA>[]> = new Map();

  protected constructor(config: MarkdownDb.Config<INPUT, ENTRY_SCHEMA>) {
    this._config = config;
  }

  /**
   * Create a MarkdownDb instance for the given directory
   * @param cwd - The FsDir or path to the directory to create the MarkdownDb instance for
   * @returns A new MarkdownDb instance
   */
  public static cwd<INPUT = unknown>(cwd: FsDir) {
    const engine = QueryEngine.default<INPUT>();
    return new MarkdownDb<INPUT, MarkdownDb.Config.Base>({
      cwd,
      queryEngine: engine,
      // @ts-expect-error - We know the base structure of the schema
      entrySchema: z.object({
        query: engine.schema.optional().prefault({ never: true }),
      }),
      globs: ["**/*.md"],
      nameSeparator: DEFAULT_NAME_SEPARATOR,
      cacheKey: null,
    });
  }

  /**
   * @returns The QueryEngine
   */
  public get query() {
    return this._config.queryEngine;
  }

  /**
   * Set a custom query engine to use for matching with custom predicates
   * @param queryEngine - The QueryEngine to use
   * @returns A new MarkdownDb instance
   */
  public setQueryEngine(queryEngine: QueryEngine<any, INPUT>) {
    // Update the config schema to use the new query engine's schema
    // @ts-ignore - We know the base structure of the schema
    const newSchema = this._config.entrySchema.omit({ query: true }).extend({
      query: queryEngine.schema.optional().prefault({ never: true }),
    }) as ENTRY_SCHEMA;
    return new MarkdownDb<INPUT, ENTRY_SCHEMA>({
      ...this._config,
      queryEngine,
      entrySchema: newSchema,
    });
  }

  /**
   * Set the zod schema used to validate extra frontmatter data
   * @param entrySchema - The zod schema to use to validate extra frontmatter data
   * @returns A new MarkdownDb instance
   */
  public setEntrySchema<NEW_ENTRY_SCHEMA extends z.ZodObject<any>>(
    entrySchema: NEW_ENTRY_SCHEMA,
  ) {
    return new MarkdownDb<INPUT, NEW_ENTRY_SCHEMA>({
      ...this._config,
      entrySchema: entrySchema.extend({
        query: this._config.queryEngine.schema
          .optional()
          .prefault({ never: true }),
      }) as NEW_ENTRY_SCHEMA,
    });
  }

  /**
   * @deprecated Use {@link setEntrySchema} instead.
   */
  public setConfigSchema<NEW_ENTRY_SCHEMA extends z.ZodObject<any>>(
    configSchema: NEW_ENTRY_SCHEMA,
  ) {
    return this.setEntrySchema(configSchema);
  }

  /**
   * Filter the markdown files with glob patterns
   */
  public setGlobs(...globs: Globs) {
    return new MarkdownDb<INPUT, ENTRY_SCHEMA>({ ...this._config, globs });
  }

  /**
   * Set the name separator when computing the entry id
   */
  public setNameSeparator(nameSeparator: string) {
    return new MarkdownDb<INPUT, ENTRY_SCHEMA>({
      ...this._config,
      nameSeparator,
    });
  }

  /**
   * Set the cache key function to use for caching the entries
   * @param cacheKey - The cache key function to use
   * @returns A new MarkdownDb instance
   */
  public setCacheKey(cacheKey: (input: INPUT) => any) {
    return new MarkdownDb<INPUT, ENTRY_SCHEMA>({ ...this._config, cacheKey });
  }

  /**
   * Check if the provided file is a markdown entry file in this db instance
   * @param file - The file to check
   * @returns True if the file is an entry file, false otherwise
   */
  public isEntryFile(file: FsFile | string) {
    const fileInstance = fsFile(file);
    // Check if the file is in the cwd
    if (!fileInstance.isInDir(this._config.cwd)) return false;
    // Check if the file matches the globs
    if (
      !glob.matches(
        fileInstance.relativePathFrom(this._config.cwd),
        this._config.globs,
      )
    )
      return false;
    // Default to true
    return true;
  }

  /**
   * Compute the entry id
   * @param mdFile - The markdown file
   * @returns The entry id
   */
  public computeEntryId(mdFile: FsFile) {
    const relativePath = mdFile.dir().relativePathFrom(this._config.cwd);
    const dirPath = relativePath.split("/");
    const lastFolderName = dirPath.pop();
    let fileName = mdFile.fileNameWithoutExtension();

    // Remove numeric prefix (e.g., "0." from "0.buttons")
    fileName = fileName.replace(/^\d+\./, "");

    // Extract type suffix if present (e.g., "my-type" from "buttons.my-type")
    let type: string | null = null;
    const typeMatch = fileName.match(/^(.+)\.(.+)$/);
    if (typeMatch) {
      fileName = typeMatch[1];
      type = typeMatch[2];
    }

    // If the last folder's name is the same as the file name, we can skip it
    const nameParts =
      lastFolderName === fileName
        ? [...dirPath, fileName]
        : [...dirPath, lastFolderName, fileName];

    return {
      name: nameParts
        .filter((part) => part !== "")
        .join(this._config.nameSeparator),
      type,
    };
  }

  /**
   * Parse the markdown file
   * @param file - The file to parse
   * @returns The parsed entry
   */
  public async fileToEntry(file: FsFile | string) {
    const mdFile = fsFile(file);

    // Check if the file is an entry file
    if (!this.isEntryFile(mdFile))
      throw new Error(t`
        File ${mdFile.path} is not an entry file in this MarkdownDb instance
          - Cwd: ${this._config.cwd.path}
          - Globs: ${this._config.globs.join(", ")}
      `);

    // Read the file
    const mdText = await mdFile.read.text();

    // Parse the header data
    const headerData = await new Promise((resolve) =>
      resolve(md.getHeaderData(mdText)),
    ).catch((err) => {
      throw new Error(
        `Failed to read markdown file header for ${this._config.cwd.relativePathTo(mdFile)}`,
        { cause: err },
      );
    });

    // Validate the header data
    const parsedData = this._config.entrySchema.safeParse(headerData ?? {});

    if (headerData === undefined && !parsedData.success) {
      throw new Error(
        `Failed to parse config for ${this._config.cwd.relativePathTo(mdFile)}. Expected a frontmatter header but got none.`,
        { cause: parsedData.error },
      );
    }

    if (!parsedData.success)
      throw new Error(
        `Failed to parse config for ${this._config.cwd.relativePathTo(mdFile)}`,
        { cause: parsedData.error },
      );

    // Compute the entry id
    const { name, type } = this.computeEntryId(mdFile);

    // Get the content
    const content = md.getBody(mdText).trim();

    // Return the entry
    return {
      $id: name,
      $type: type,
      $content: content.length > 0 ? content : null,
      $file: mdFile,
      ...parsedData.data,
    };
  }

  /**
   * Read the entries from the filesystem
   */
  private async readEntries() {
    const mdFiles = await this._config.cwd
      .glob(this._config.globs)
      // Sort by path
      .then((files) =>
        files.sort((a, b) =>
          a
            .relativePathFrom(this._config.cwd)
            .localeCompare(b.relativePathFrom(this._config.cwd)),
        ),
      );

    return Promise.all(mdFiles.map(async (mdFile) => this.fileToEntry(mdFile)));
  }

  /**
   * Refresh the markdown entries from the filesystem
   */
  public refreshEntries() {
    this._cacheMap.clear();
    this._config.queryEngine.clearCache();
    this._entriesPromise = this.readEntries();
    this._entriesMapPromise = this._entriesPromise.then(
      (entries) => new Map(entries.map((entry) => [entry.$id, entry])),
    );
    this._parentPatternsMapPromise = null; // Reset parent entries cache
  }

  /**
   * Return all entries as an array of unique entries
   */
  public async getAll() {
    if (!this._entriesPromise) {
      this._entriesPromise = this.readEntries();
    }
    return this._entriesPromise;
  }

  /**
   * Return the entries as a Map<id, entry> for quick lookup
   */
  public async getAllMap() {
    if (!this._entriesMapPromise) {
      this._entriesMapPromise = this.getAll().then(
        (entries) => new Map(entries.map((entry) => [entry.$id, entry])),
      );
    }
    return this._entriesMapPromise;
  }

  /**
   * Return the entry for the given id
   */
  public async getOneById(id: string) {
    const entries = await this.getAllMap();
    return entries.get(id);
  }

  /**
   * Return the parent entries for all entries
   */
  public async getParentsMap() {
    if (!this._parentPatternsMapPromise) {
      this._parentPatternsMapPromise = this.getAll().then((entries) => {
        const entriesMap = new Map(entries.map((p) => [p.$id, p]));
        const parentMap = new Map<string, Entry<ENTRY_SCHEMA>[]>();

        // Precompute parent entries for each entry
        for (const entry of entries) {
          const path = entry.$id.split(this._config.nameSeparator);
          const parentEntries: Entry<ENTRY_SCHEMA>[] = [];

          // Build parent chain: "a" -> "a/b" -> "a/b/c"
          for (let i = 1; i < path.length; i++) {
            const parentName = path
              .slice(0, i)
              .join(this._config.nameSeparator);
            const parentPattern = entriesMap.get(parentName);
            if (parentPattern) {
              parentEntries.push(parentPattern);
            }
          }

          parentMap.set(entry.$id, parentEntries);
        }

        return parentMap;
      });
    }
    return this._parentPatternsMapPromise;
  }

  /**
   * Return the parent entries for the given id
   */
  public async getParentsById(id: string) {
    const parentMap = await this.getParentsMap();
    return parentMap.get(id) || [];
  }

  private async _matchOne(input: INPUT) {
    // Retrieve all entries and parent entries map
    const entries = await this.getAll();
    const parentMap = await this.getParentsMap();

    const matchingEntries: Entry<ENTRY_SCHEMA>[] = [];
    const evaluatedPatterns = new Map<string, boolean>(); // pattern id -> matched

    // Process entries in order (already sorted so parents come before children)
    for (const entry of entries) {
      const parentPatterns = parentMap.get(entry.$id) ?? [];

      // Check if all parent patterns matched (skip if not)
      if (parentPatterns.length > 0) {
        const allParentsMatched = parentPatterns.every((p) => {
          const parentMatched = evaluatedPatterns.get(p.$id);
          // If parent hasn't been evaluated yet, it means it's not in entries
          // This can happen - treat as matched
          return parentMatched !== false;
        });
        if (!allParentsMatched) {
          // Parents didn't match, so this pattern can't match either
          evaluatedPatterns.set(entry.$id, false);
          continue;
        }
      }

      const matches = this.query.match(entry.query, input, {
        skipQueryValidation: true,
        useCache: true,
      });

      evaluatedPatterns.set(entry.$id, matches);

      if (matches) {
        matchingEntries.push(entry);
      }
    }

    return matchingEntries;
  }

  /**
   * Return all entries matching the input
   */
  public async matchOne(
    input: INPUT,
    config?: {
      /**
       * Skip markdown entries with empty content
       */
      skipEmpty?: boolean;
    },
  ) {
    let entries: Entry<ENTRY_SCHEMA>[] = [];

    // Use cache if a cache key function is provided
    if (this._config.cacheKey) {
      const entryHash = this._config.cacheKey(input);
      if (this._cacheMap.has(entryHash)) {
        entries = this._cacheMap.get(entryHash)!;
      } else {
        entries = await this._matchOne(input);
        this._cacheMap.set(entryHash, entries);
      }
    } else {
      entries = await this._matchOne(input);
    }

    if (config?.skipEmpty) {
      return entries.filter((entry) => entry.$content?.trim());
    }

    return entries;
  }

  /**
   * Return all entries matching any of the inputs
   */
  public async matchAny(
    inputs: INPUT[],
    config: {
      /**
       * Skip markdown entries with empty content
       */
      skipEmpty?: boolean;
    } = { skipEmpty: false },
  ) {
    const allResults = await Promise.all(
      inputs.map((input) => this.matchOne(input, config)),
    );

    // Remove duplicates
    return Object.values(
      allResults.flat().reduce(
        (acc, result) => {
          acc[result.$id] = result;
          return acc;
        },
        {} as Record<string, Entry<ENTRY_SCHEMA>>,
      ),
    ).sort((a, b) => a.$file.path.localeCompare(b.$file.path));
  }

  /**
   * Return the zod/v4 configuration schema
   */
  public get schema() {
    return this._config.entrySchema;
  }

  /**
   * Return the JSON schema representation of the configuration schema
   * Validates against the input type
   */
  public get jsonSchema() {
    return z.toJSONSchema(this.schema, { io: "input" });
  }
}

export declare namespace MarkdownDb {
  export interface Config<
    INPUT = unknown,
    ENTRY_SCHEMA extends MarkdownDb.Config.Base = MarkdownDb.Config.Base,
  > {
    cwd: FsDir;
    entrySchema: ENTRY_SCHEMA;
    nameSeparator: string;
    cacheKey: ((input: any) => any) | null;
    globs: Globs;
    queryEngine: QueryEngine<any, any>;
  }

  export namespace Config {
    // Todo: fix typings in main class so it works
    export type Infer<T extends MarkdownDb<any, any>> =
      T extends MarkdownDb<any, infer ENTRY_SCHEMA>
        ? z.input<ENTRY_SCHEMA>
        : never;

    export type Base = z.ZodObject<{
      query: z.ZodOptional<z.ZodType<unknown>>;
    }>;
  }

  export namespace Entry {
    export SCHEMA;
  }
}
