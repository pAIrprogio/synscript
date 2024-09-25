#!/usr/bin/env node --import tsx
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

const packages = await glob("./packages/*/package.json");

const orderKeys = (obj: { [key: string]: any }) =>
  Object.keys(obj)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

await Promise.all(
  packages.map(async (packagePath) => {
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
      packageManager: "yarn@4.4.0",
      type: "module",
      version: packageJson.version ?? "1.0.0",
      description: packageJson.description,
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
      keywords: packageJson.keywords,
      scripts: {
        ...packageJson.scripts,
        publish: "yarn npm publish --access public",
        prepublish: "yarn test && yarn build",
        build: "tsup",
        "build:watch": "tsup --watch",
        "test:types": "tsc --noEmit",
        "test:unit": "node --import tsx --test src/**/*.test.ts",
        "test:unit:watch": "node --import tsx --watch --test src/**/*.test.ts",
        test: "yarn test:types && yarn test:unit",
      },
      exports: orderKeys({
        ...packageJson.exports,
        ".": {
          import: {
            types: `./src/${name}.index.ts`,
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
        "@types/node": "^22.7.0",
        tsup: "^8.3.0",
        tsx: "^4.19.1",
        typescript: "^5.6.2",
      } as {}),
      include: ["src/**/*.ts", "!src/**/*.test.ts", "dist/**/*"],
    };
    await writeFile(
      packagePath,
      JSON.stringify(newPackageJson, null, 2) + "\n",
      "utf-8",
    );
  }),
);
