import type { FsDir } from "@synstack/fs";
import { QueryEngine } from "@synstack/query";
import { z } from "zod/v4";
import { getPatterns, NAME_SEPARATOR } from "./markdown-patterns.lib.ts";

type BaseConfigSchema = z.ZodObject<{
  query: z.ZodType<unknown>;
}>;

type Pattern<CONFIG_SCHEMA extends BaseConfigSchema> = Awaited<
  ReturnType<typeof getPatterns<CONFIG_SCHEMA>>
>[number];

export class MarkdownPatternsEngine<
  INPUT = unknown,
  CONFIG_SCHEMA extends BaseConfigSchema = BaseConfigSchema,
> {
  private _configSchema;
  private _cwd;
  private _queryEngine;
  private _glob: string = "**/*.md";
  private _patternsPromise: Promise<Pattern<CONFIG_SCHEMA>[]> | null = null;
  private _patternsMapPromise: Promise<
    Map<string, Pattern<CONFIG_SCHEMA>>
  > | null = null;
  private _parentPatternsMapPromise: Promise<
    Map<string, Pattern<CONFIG_SCHEMA>[]>
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
    return new MarkdownPatternsEngine<INPUT, BaseConfigSchema>(
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
    return new MarkdownPatternsEngine(
      this._cwd,
      queryEngine,
      newSchema,
      this._glob,
    );
  }

  public setConfigSchema<NEW_CONFIG_SCHEMA extends z.ZodObject<any>>(
    configSchema: NEW_CONFIG_SCHEMA,
  ) {
    return new MarkdownPatternsEngine(
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
    return new MarkdownPatternsEngine(
      this._cwd,
      this._queryEngine,
      this._configSchema,
      glob,
    );
  }

  public async refreshPatterns() {
    this._patternsPromise = getPatterns(this._cwd, this.schema, this._glob);
    this._patternsMapPromise = this._patternsPromise.then(
      (patterns) =>
        new Map(patterns.map((pattern) => [pattern.$name, pattern])),
    );
    this._parentPatternsMapPromise = null; // Reset parent patterns cache
  }

  public async getPatterns() {
    if (!this._patternsPromise) {
      this._patternsPromise = getPatterns(this._cwd, this.schema, this._glob);
    }
    return this._patternsPromise;
  }

  public async getPatternsMap() {
    if (!this._patternsMapPromise) {
      this._patternsMapPromise = this.getPatterns().then(
        (patterns) =>
          new Map(patterns.map((pattern) => [pattern.$name, pattern])),
      );
    }
    return this._patternsMapPromise!;
  }

  public async getPatternByName(name: string) {
    const patternsMap = await this.getPatternsMap();
    return patternsMap.get(name);
  }

  public async getParentPatternsMap() {
    if (!this._parentPatternsMapPromise) {
      this._parentPatternsMapPromise = this.getPatterns().then((patterns) => {
        const patternsMap = new Map(patterns.map((p) => [p.$name, p]));
        const parentMap = new Map<string, Pattern<CONFIG_SCHEMA>[]>();

        // Precompute parent patterns for each pattern
        for (const pattern of patterns) {
          const path = pattern.$name.split(NAME_SEPARATOR);
          const parentPatterns: Pattern<CONFIG_SCHEMA>[] = [];

          // Build parent chain: "a" -> "a/b" -> "a/b/c"
          for (let i = 1; i <= path.length; i++) {
            const parentName = path.slice(0, i).join(NAME_SEPARATOR);
            const parentPattern = patternsMap.get(parentName);
            if (parentPattern) {
              parentPatterns.push(parentPattern);
            }
          }

          parentMap.set(pattern.$name, parentPatterns);
        }

        return parentMap;
      });
    }
    return this._parentPatternsMapPromise!;
  }

  public async getParentPatterns(pattern: string) {
    const parentMap = await this.getParentPatternsMap();
    return parentMap.get(pattern) || [];
  }

  public async matchingPatterns(input: INPUT) {
    // Retrieve all patterns and parent patterns map
    const patterns = await this.getPatterns();
    const parentMap = await this.getParentPatternsMap();

    const matchingPatterns: Pattern<CONFIG_SCHEMA>[] = [];

    // Process patterns synchronously instead of creating promise storm
    for (const pattern of patterns) {
      const parentPatterns = parentMap.get(pattern.$name) ?? [];

      // Create a query that matches parent patterns and the current pattern
      const query =
        parentPatterns.length > 0
          ? {
              and: [
                ...parentPatterns.map((parent) => parent.query),
                pattern.query,
              ],
            }
          : pattern.query;

      // If the query matches, add the pattern
      if (
        this.query.match(query, input, {
          skipQueryValidation: true,
        })
      ) {
        matchingPatterns.push(pattern);
      }
    }

    return matchingPatterns;
  }

  public async matchingPatternNames(input: INPUT) {
    const patterns = await this.matchingPatterns(input);
    return patterns.map((pattern) => pattern.$name);
  }

  public get schema() {
    return this._configSchema;
  }

  public get jsonSchema() {
    return z.toJSONSchema(this.schema);
  }
}

export declare namespace MarkdownPatternsEngine {
  export namespace Config {
    // Todo: fix typings in main class so it works
    export type Infer<T extends MarkdownPatternsEngine<any, any>> =
      T extends MarkdownPatternsEngine<any, infer CONFIG_SCHEMA>
        ? z.input<CONFIG_SCHEMA>
        : never;
  }

  export namespace Pattern {
    export type Infer<T extends MarkdownPatternsEngine<any, any>> = Awaited<
      ReturnType<T["getPatterns"]>
    >[number];
  }
}
