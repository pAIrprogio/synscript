#!/usr/bin/env node --experimental-strip-types
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

const packages = await glob("./packages/*/package.json");

const orderKeys = (obj: { [key: string]: any }) =>
  Object.keys(obj)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

await Promise.all(
  packages.map(async (packagePath) => {
    console.log(packagePath);
    const content = await readFile(packagePath, "utf-8");
    const packageJson = (() => {
      try {
        return JSON.parse(content);
      } catch {
        throw new Error("Failed to parse package.json for " + packagePath);
      }
    })();
    if (packageJson.private) return;

    const name = packagePath.match(/packages\/(.*)\/package.json/)?.[1];
    if (!name) throw new Error("Couldn't extract package name " + packagePath);
    const newPackageJson = {
      name: `@synstack/${name}`,
      type: "module",
      publishConfig: {
        access: "public",
      },
      // packageManager: "yarn@4.5.1",
      version: packageJson.version ?? "1.0.0",
      description: packageJson.description,
      keywords: packageJson.keywords,
      author: {
        name: "pAIrprog",
        url: "https://pairprog.io",
      },
      homepage: `https://github.com/pAIrprogio/synscript/tree/main/packages/${name}`,
      repository: {
        type: "git",
        url: "https://github.com/pAIrprogio/syn-stack.git",
        directory: `packages/${name}`,
      },
      license: "Apache-2.0",
      scripts: {
        ...packageJson.scripts,
        prepare: "yarn test && yarn build",
        build: "tsup",
        "build:watch": "tsup --watch",
        "test:types": "tsc --noEmit",
        "test:unit":
          "node --experimental-strip-types --experimental-test-snapshots --no-warnings --test src/**/*.test.ts",
        "test:unit:watch":
          "node --experimental-strip-types --experimental-test-snapshots --no-warnings --watch --test --watch src/**/*.test.ts",
        test: "yarn test:types && yarn test:unit",
      },
      exports: orderKeys({
        ...packageJson.exports,
        ".": {
          import: {
            types: `./dist/${name}.index.d.ts`,
            default: `./dist/${name}.index.js`,
          },
          require: {
            types: `./dist/${name}.index.d.cts`,
            default: `./dist/${name}.index.cjs`,
          },
        },
      } as {}),
      dependencies: orderKeys({
        ...packageJson.dependencies,
      } as {}),
      devDependencies: orderKeys({
        ...packageJson.devDependencies,
        "@types/node": "^22.10.1",
        tsup: "^8.3.5",
        typescript: "^5.7.2",
      } as {}),
      peerDependencies: orderKeys({
        ...packageJson.peerDependencies,
      } as {}),
      files: ["src/**/*.ts", "!src/**/*.test.ts", "dist/**/*"],
      gitHead: packageJson.gitHead,
    };

    if (Object.keys(newPackageJson.peerDependencies).length === 0)
      // @ts-expect-error - This is a script, don't care
      delete newPackageJson.peerDependencies;
    if (Object.keys(newPackageJson.dependencies).length === 0)
      // @ts-expect-error - This is a script, don't care
      delete newPackageJson.dependencies;
    if (Object.keys(newPackageJson.devDependencies).length === 0)
      // @ts-expect-error - This is a script, don't care
      delete newPackageJson.devDependencies;

    await writeFile(
      packagePath,
      JSON.stringify(newPackageJson, null, 2) + "\n",
      "utf-8",
    );
  }),
);
