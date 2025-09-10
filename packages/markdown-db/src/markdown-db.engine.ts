import type { FsDir } from "@synstack/fs";
import { QueryEngine } from "@synstack/query";
import { z } from "zod/v4";
import { getMarkdownEntries, NAME_SEPARATOR } from "./markdown-db.lib.ts";

type Globs = [string, ...string[]];

type BaseConfigSchema = z.ZodObject<{
  query: z.ZodType<unknown>;
}>;

type Entry<CONFIG_SCHEMA extends BaseConfigSchema> = Awaited<
  ReturnType<typeof getMarkdownEntries<CONFIG_SCHEMA>>
>[number];

export class MarkdownDb<
  INPUT = unknown,
  CONFIG_SCHEMA extends BaseConfigSchema = BaseConfigSchema,
> {
  private _configSchema;
  private _cwd;
  private _queryEngine;
  private _globs: Globs = ["**/*.md"];
  private _entriesPromise: Promise<Entry<CONFIG_SCHEMA>[]> | null = null;
  private _entriesMapPromise: Promise<
    Map<string, Entry<CONFIG_SCHEMA>>
  > | null = null;
  private _parentPatternsMapPromise: Promise<
    Map<string, Entry<CONFIG_SCHEMA>[]>
  > | null = null;

  protected constructor(
    cwd: FsDir,
    queryEngine: QueryEngine<any, INPUT>,
    configSchema: CONFIG_SCHEMA,
    globs: Globs = ["**/*.md"],
  ) {
    this._cwd = cwd;
    this._queryEngine = queryEngine;
    this._configSchema = configSchema;
    this._globs = globs;
  }

  /**
   * Create a MarkdownDb instance for the given directory
   * @param cwd - The FsDir or path to the directory to create the MarkdownDb instance for
   * @returns A new MarkdownDb instance
   */
  public static cwd<INPUT = unknown>(cwd: FsDir) {
    const engine = QueryEngine.default<INPUT>();
    return new MarkdownDb<INPUT, BaseConfigSchema>(
      cwd,
      engine,
      z.object({ query: engine.schema }),
    );
  }

  /**
   * @returns The QueryEngine
   */
  public get query() {
    return this._queryEngine;
  }

  /**
   * Set a custom query engine to use for matching with custom predicates
   * @param queryEngine - The QueryEngine to use
   * @returns A new MarkdownDb instance
   */
  public setQueryEngine(queryEngine: QueryEngine<any, INPUT>) {
    // Update the config schema to use the new query engine's schema
    const newSchema = this._configSchema.omit({ query: true }).extend({
      query: queryEngine.schema,
    }) as CONFIG_SCHEMA;
    return new MarkdownDb(this._cwd, queryEngine, newSchema, this._globs);
  }

  /**
   * Set the zod schema used to validate extra frontmatter data
   * @param configSchema - The zod schema to use to validate extra frontmatter data
   * @returns A new MarkdownDb instance
   */
  public setConfigSchema<NEW_CONFIG_SCHEMA extends z.ZodObject<any>>(
    configSchema: NEW_CONFIG_SCHEMA,
  ) {
    return new MarkdownDb(
      this._cwd,
      this._queryEngine,
      configSchema.extend({
        query: this._queryEngine.schema,
      }) as NEW_CONFIG_SCHEMA extends z.ZodObject<infer T>
        ? z.ZodObject<T & { query: z.ZodType<unknown> }>
        : never,
      this._globs,
    );
  }

  /**
   * Filter the markdown files with glob patterns
   * The "**\/*.md" glob is always included
   */
  public setGlobs(...globs: Globs) {
    return new MarkdownDb(this._cwd, this._queryEngine, this._configSchema, [
      "**/*.md",
      ...globs,
    ]);
  }

  /**
   * Refresh the markdown entries from the filesystem
   */
  public async refreshEntries() {
    this._entriesPromise = getMarkdownEntries(
      this._cwd,
      this.schema,
      this._globs,
    );
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
      this._entriesPromise = getMarkdownEntries(
        this._cwd,
        this.schema,
        this._globs,
      );
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
    return this._entriesMapPromise!;
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
        const parentMap = new Map<string, Entry<CONFIG_SCHEMA>[]>();

        // Precompute parent entries for each entry
        for (const entry of entries) {
          const path = entry.$id.split(NAME_SEPARATOR);
          const parentEntries: Entry<CONFIG_SCHEMA>[] = [];

          // Build parent chain: "a" -> "a/b" -> "a/b/c"
          for (let i = 1; i <= path.length; i++) {
            const parentName = path.slice(0, i).join(NAME_SEPARATOR);
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
    return this._parentPatternsMapPromise!;
  }

  /**
   * Return the parent entries for the given id
   */
  public async getParentsById(id: string) {
    const parentMap = await this.getParentsMap();
    return parentMap.get(id) || [];
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
    // Retrieve all entries and parent entries map
    const entries = await this.getAll();
    const parentMap = await this.getParentsMap();

    const matchingEntries: Entry<CONFIG_SCHEMA>[] = [];

    // Process entries synchronously instead of creating promise storm
    for (const entry of entries) {
      const parentPatterns = parentMap.get(entry.$id) ?? [];

      // Create a query that matches parent entries and the current entry
      const query =
        parentPatterns.length > 0
          ? {
              and: [
                ...parentPatterns.map((parent) => parent.query),
                entry.query,
              ],
            }
          : entry.query;

      // If the query matches, add the entry
      if (
        this.query.match(query, input, {
          skipQueryValidation: true,
        })
      ) {
        if (config?.skipEmpty && !entry.$content?.trim()) continue;
        matchingEntries.push(entry);
      }
    }

    return matchingEntries;
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
          if (config.skipEmpty && !result.$content?.trim()) return acc;
          acc[result.$id] = result;
          return acc;
        },
        {} as Record<string, Entry<CONFIG_SCHEMA>>,
      ),
    ).sort((a, b) => a.$file.path.localeCompare(b.$file.path));
  }

  /**
   * Return the zod/v4 configuration schema
   */
  public get schema() {
    return this._configSchema;
  }

  /**
   * Return the JSON schema representation of the configuration schema
   */
  public get jsonSchema() {
    return z.toJSONSchema(this.schema);
  }
}

export declare namespace MarkdownDb {
  export namespace Config {
    // Todo: fix typings in main class so it works
    export type Infer<T extends MarkdownDb<any, any>> =
      T extends MarkdownDb<any, infer CONFIG_SCHEMA>
        ? z.input<CONFIG_SCHEMA>
        : never;
  }

  export namespace Entry {
    export type Infer<T extends MarkdownDb<any, any>> = Awaited<
      ReturnType<T["getAll"]>
    >[number];
  }
}
