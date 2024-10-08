import { OneToN } from "@shared/src/ts.utils";
import { dir } from "@synstack/fs";
import { deepEqual } from "./deepEqual.lib";

type $Partial<T> = Partial<T>;

interface CacheValue<TValue = any> {
  input: any;
  output: TValue;
}

declare namespace FsCache {
  export type KeyFn<TFnArgs extends any[] = any[]> =
    | string
    | ((...args: TFnArgs) => string);
  export type Key<TFnArgs extends any[] = any[]> = OneToN<KeyFn<TFnArgs>>;

  interface Options<TFnArgs extends any[] = any[]> {
    cwd: string;
    key: Key<TFnArgs>;
    pretty?: boolean;
  }

  namespace Options {
    export type Partial = $Partial<Options>;
  }
}

export class FsCache<TConfig extends FsCache.Options.Partial> {
  private readonly _config: TConfig;

  private constructor(config: TConfig) {
    this._config = config;
  }

  public static cwd(this: void, cwd: string) {
    return new FsCache({ cwd });
  }

  public key<TFnArgs extends any[], TKey extends FsCache.Key<TFnArgs>>(
    key: TKey,
  ) {
    return new FsCache({ ...this._config, key });
  }

  public pretty(pretty: boolean) {
    return new FsCache({ ...this._config, pretty });
  }

  private static keyToRelativePath(key: FsCache.Key, args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return `./${key.map((k) => (k instanceof Function ? k(...args) : k)).join("/")}.json`;
  }

  public async get<TFnArgs extends any[], TValue = any>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    args: TFnArgs,
  ): Promise<["miss", null] | ["hit", TValue]> {
    const relativePath = FsCache.keyToRelativePath(this._config.key, args);
    const cacheDir = dir(this._config.cwd);

    if (!(await cacheDir.file(relativePath).exists())) return ["miss", null];

    const value = await cacheDir
      .file(relativePath)
      .read.json<CacheValue<TValue>>();

    if (value === null) return ["miss", null];

    // Todo: FIX CACHE HIT
    if (!deepEqual(value.input, args)) return ["miss", null];

    return ["hit", value.output];
  }

  public async setDefault<TFnArgs extends any[], TValue = any>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    args: TFnArgs,
    defaultValue: TValue,
  ) {
    const [status] = await this.get<TFnArgs, TValue>(args);
    if (status === "hit") return false;
    return this.set(args, defaultValue);
  }

  public async set<TFnArgs extends any[]>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    args: TFnArgs,
    value: any,
  ) {
    const relativePath = FsCache.keyToRelativePath(this._config.key, args);
    const file = dir(this._config.cwd).file(relativePath);
    return file.write.text(
      JSON.stringify(
        { input: args, output: value } satisfies CacheValue,
        null,
        this._config.pretty ? 2 : undefined,
      ),
    );
  }

  public fn<TFnArgs extends any[], TFnOutput>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    fn: (...args: TFnArgs) => Promise<TFnOutput> | TFnOutput,
  ): (...args: TFnArgs) => Promise<TFnOutput> {
    return async (...args: TFnArgs): Promise<TFnOutput> => {
      const [status, value] = await this.get<TFnArgs, TFnOutput>(args);
      if (status === "hit") return value;

      const output = await Promise.resolve(fn(...args));
      await this.set(args, output);
      return output;
    };
  }
}

export const fsCache = FsCache.cwd;
