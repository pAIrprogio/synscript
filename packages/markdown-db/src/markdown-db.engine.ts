import type { FsDir } from "@synstack/fs";
import { QueryEngine } from "@synstack/query";
import { z } from "zod/v4";
import { getMarkdownEntries, NAME_SEPARATOR } from "./markdown-db.lib.ts";

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
  private _glob: string = "**/*.md";
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
    glob: string = "**/*.md",
  ) {
    this._cwd = cwd;
    this._queryEngine = queryEngine;
    this._configSchema = configSchema;
    this._glob = glob;
  }

  public static cwd<INPUT = unknown>(cwd: FsDir) {
    const engine = QueryEngine.default<INPUT>();
    return new MarkdownDb<INPUT, BaseConfigSchema>(
      cwd,
      engine,
      z.object({ query: engine.schema }),
    );
  }

  public get query() {
    return this._queryEngine;
  }

  public setQueryEngine(queryEngine: QueryEngine<any, INPUT>) {
    // Update the config schema to use the new query engine's schema
    const newSchema = this._configSchema.omit({ query: true }).extend({
      query: queryEngine.schema,
    }) as CONFIG_SCHEMA;
    return new MarkdownDb(this._cwd, queryEngine, newSchema, this._glob);
  }

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
      this._glob,
    );
  }

  public setGlob(glob: string) {
    return new MarkdownDb(
      this._cwd,
      this._queryEngine,
      this._configSchema,
      glob,
    );
  }

  public async refreshEntries() {
    this._entriesPromise = getMarkdownEntries(
      this._cwd,
      this.schema,
      this._glob,
    );
    this._entriesMapPromise = this._entriesPromise.then(
      (entries) => new Map(entries.map((entry) => [entry.$id, entry])),
    );
    this._parentPatternsMapPromise = null; // Reset parent entries cache
  }

  public async getEntries() {
    if (!this._entriesPromise) {
      this._entriesPromise = getMarkdownEntries(
        this._cwd,
        this.schema,
        this._glob,
      );
    }
    return this._entriesPromise;
  }

  public async getEntriesMap() {
    if (!this._entriesMapPromise) {
      this._entriesMapPromise = this.getEntries().then(
        (entries) => new Map(entries.map((entry) => [entry.$id, entry])),
      );
    }
    return this._entriesMapPromise!;
  }

  public async getEntryById(id: string) {
    const entries = await this.getEntriesMap();
    return entries.get(id);
  }

  public async getParentEntriesMap() {
    if (!this._parentPatternsMapPromise) {
      this._parentPatternsMapPromise = this.getEntries().then((entries) => {
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

  public async getParentEntries(id: string) {
    const parentMap = await this.getParentEntriesMap();
    return parentMap.get(id) || [];
  }

  public async match(
    input: INPUT,
    config: {
      /**
       * Skip markdown entries with empty content
       */
      skipEmpty?: boolean;
    } = { skipEmpty: false },
  ) {
    // Retrieve all entries and parent entries map
    const entries = await this.getEntries();
    const parentMap = await this.getParentEntriesMap();

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
        if (config.skipEmpty && !entry.$content?.trim()) continue;
        matchingEntries.push(entry);
      }
    }

    return matchingEntries;
  }

  public async matchAll(
    inputs: INPUT[],
    config: {
      /**
       * Skip markdown entries with empty content
       */
      skipEmpty?: boolean;
    } = { skipEmpty: false },
  ) {
    const allResults = await Promise.all(
      inputs.map((input) => this.match(input, config)),
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

  public get schema() {
    return this._configSchema;
  }

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
      ReturnType<T["getEntries"]>
    >[number];
  }
}
