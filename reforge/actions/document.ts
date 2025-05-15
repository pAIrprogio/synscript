/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { assistantMsg, systemMsg, userMsg } from "@synstack/llm";
import { t } from "@synstack/text";
import { fileAgent } from "../agents/file.agent.ts";
import { fileToPrompt } from "../prompt-components/file.component.ts";
import { getRuntimeContext } from "../runtime/context.runtime.ts";
import { rootDir } from "../runtime/workspace.runtime.ts";

async function main() {
  const runtimeContext = await getRuntimeContext();
  const { focusedFile, openedFiles } = runtimeContext;

  if (!focusedFile) throw new Error("No file is actively focused");

  console.log("Documenting file: ", focusedFile.relativePathFrom(rootDir));

  const prompt = [
    systemMsg`Document the provided <target/> using JSDoc comments.`,
    userMsg`
      # Context
      ## File to document
      ${fileToPrompt(focusedFile)}

      ${
        openedFiles.length > 1 &&
        t`
          ## Sample files
          ${openedFiles.map((f) => fileToPrompt(f))}
        `
      }

      # Instructions
      - Use the provided sample files to understand the context of the file.
      - Rewrite the file with JSDoc comments.
    `,
    assistantMsg`
      <file path="${focusedFile.relativePathFrom(rootDir)}">
    `,
  ];

  await fileAgent(prompt);
}

await main().then(() => {
  console.log("Done");
  // Force IPC to close
  process.exit(0);
});
