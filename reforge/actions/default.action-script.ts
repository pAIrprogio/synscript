import { getRuntimeContext } from "../runtime/context.runtime.ts";
import { packageWorkflow } from "../scopes/package/package.workflow.ts";

async function main() {
  const runtimeContext = await getRuntimeContext();
  const { focusedFile } = runtimeContext;

  if (!focusedFile) throw new Error("No file is actively focused");

  const context = {
    ...runtimeContext,
    focusedFile,
  };

  if (focusedFile.matchesGlobs("**/packages/**/*")) {
    return packageWorkflow(context);
  }
}

await main().then(() => {
  console.log("Done");
  // Force IPC to close
  process.exit(0);
});
