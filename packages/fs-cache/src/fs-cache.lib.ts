import { dir, FsDir } from "@synstack/fs";
import { type OneToN } from "../../shared/src/ts.utils.ts";
import { deepEqual } from "./deepEqual.lib.ts";

type $Partial<T> = Partial<T>;

interface CacheValue<TValue = any> {
  isLocked?: boolean;
  input: any;
  output: TValue;
}

declare namespace FsCache {
  export type KeyFn<TFnArgs extends any[] = any[]> =
    | string
    | ((...args: TFnArgs) => string);

  export type Key<TFnArgs extends any[] = any[]> = OneToN<KeyFn<TFnArgs>>;

  export type SignatureFn<TFnArgs extends any[] = any[]> = (
    ...args: TFnArgs
  ) => any;

  interface Options<TFnArgs extends any[] = any[]> {
    cwd: string;
    key: Key<TFnArgs>;
    signatureFn?: SignatureFn<TFnArgs>;
    pretty?: boolean;
  }

  namespace Options {
    export type Partial = $Partial<Options>;
  }
}

export class FsCache<
  TConfig extends FsCache.Options.Partial = FsCache.Options.Partial,
> {
  private readonly _config: TConfig;

  private constructor(config: TConfig) {
    this._config = {
      ...config,
    } as TConfig & { signatureFn: FsCache.SignatureFn };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async serializeInput<TFnArgs extends any[]>(...args: TFnArgs) {
    if (this._config.signatureFn) return this._config.signatureFn(...args);
    return args;
  }

  public static cwd(this: void, cwd: string | FsDir) {
    if (cwd instanceof FsDir) return new FsCache({ cwd: cwd.path });
    return new FsCache({ cwd });
  }

  public key<TFnArgs extends any[], TKey extends FsCache.Key<TFnArgs>>(
    key: TKey,
  ) {
    return new FsCache({ ...this._config, key });
  }

  public signatureFn<TFnArgs extends any[]>(
    signatureFn: FsCache.SignatureFn<TFnArgs>,
  ) {
    return new FsCache({ ...this._config, signatureFn });
  }

  public pretty(pretty: boolean) {
    return new FsCache({ ...this._config, pretty });
  }

  private static keyToRelativePath(key: FsCache.Key, args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return `./${key.map((k) => (k instanceof Function ? k(...args) : k)).join("/")}.json`;
  }

  public async lock<TFnArgs extends any[]>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    isLocked: boolean,
    args: TFnArgs,
  ) {
    const relativePath = FsCache.keyToRelativePath(this._config.key, args);
    const cacheDir = dir(this._config.cwd);
    const file = cacheDir.file(relativePath);

    if (!(await file.exists())) {
      console.warn(
        "[fs-cache] Failed to update lock on non-existing file",
        file.path,
      );
      return;
    }

    const value = await file.read.json<CacheValue>();
    await file.write.json({
      ...value,
      isLocked,
    });
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

    if (
      value.isLocked ||
      deepEqual(value.input, await this.serializeInput(...args))
    )
      return ["hit", value.output];

    return ["miss", null];
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
        {
          input: await this.serializeInput(...args),
          output: value,
        } satisfies CacheValue,
        null,
        this._config.pretty ? 2 : undefined,
      ),
    );
  }

  public fn<TFnArgs extends any[], TFnOutput>(
    this: FsCache<FsCache.Options<TFnArgs>>,
    fn: (...args: TFnArgs) => TFnOutput,
  ): (...args: TFnArgs) => Promise<Awaited<TFnOutput>> {
    return async (...args: TFnArgs): Promise<Awaited<TFnOutput>> => {
      const [status, value] = await this.get<TFnArgs, TFnOutput>(args);
      if (status === "hit") return value as Awaited<TFnOutput>;

      const output = await Promise.resolve(fn(...args));
      await this.set(args, output);
      return output;
    };
  }
}

export const fsCache = FsCache.cwd;
