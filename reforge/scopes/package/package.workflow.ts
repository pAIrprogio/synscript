import { BaseContext } from "../../runtime/context.runtime.ts";
import { rootDir } from "../../runtime/workspace.runtime.ts";
import { readmeAgent } from "./readme.agent.ts";

export interface PackageContext extends BaseContext {
  packageName: string;
}

export async function packageWorkflow(context: BaseContext) {
  console.log("Entering package workflow");

  const match = context.focusedFile.globCapture("**/packages/(*)/**/*");
  if (!match) throw new Error("No matching package found");
  const [packageName] = match;

  const newContext: PackageContext = {
    ...context,
    packageName,
  };

  if (context.focusedFile.matchesGlobs("**/packages/*/README.md"))
    return readmeAgent(newContext);

  throw new Error(
    `No matching package workflow found for ${context.focusedFile.relativePathFrom(rootDir)}`,
  );
}
