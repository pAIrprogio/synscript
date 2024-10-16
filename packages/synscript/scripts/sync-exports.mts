#!/usr/bin/env node --import tsx
import { dir, file } from "@synstack/fs";

const subPackagesDir = dir(import.meta.dirname).to("../src/sub-packages");
const subPackagesFiles = await subPackagesDir.glob("**/*.index.ts");

const orderKeys = (obj: { [key: string]: any }) =>
  Object.keys(obj)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

const subExports = subPackagesFiles.reduce((acc, file) => {
  const exportName = file
    .relativePathFrom(subPackagesDir)
    .replace(".index.ts", "");
  console.log(exportName);
  return {
    ...acc,
    [`./${exportName}`]: {
      import: {
        types: `./dist/${exportName}.index.d.ts`,
        default: `./dist/${exportName}.index.js`,
      },
      require: {
        types: `./dist/${exportName}.index.d.cts`,
        default: `./dist/${exportName}.index.cjs`,
      },
    },
  };
}, {});

const exports = {
  ".": {
    import: {
      types: "./dist/synscript.index.d.ts",
      default: "./dist/synscript.index.js",
    },
    require: {
      types: "./dist/synscript.index.d.cts",
      default: "./dist/synscript.index.cjs",
    },
  },
  ...orderKeys(subExports),
};

const packageFile = file("package.json");
const packageJson = await packageFile.read.json<any>();
packageJson.exports = exports;
await packageFile.write.prettyJson(packageJson);
