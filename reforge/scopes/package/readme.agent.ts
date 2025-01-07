/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { reforge, tIf } from "@synstack/synscript";
import { assistantMsg, systemMsg, userMsg } from "@synstack/synscript/llm";
import { fileAgent } from "../../agents/file.agent.ts";
import { fileToPrompt } from "../../prompt-components/file.component.ts";
import { rootDir } from "../../runtime/workspace.runtime.ts";
import { type PackageContext } from "./package.workflow.ts";

export async function readmeAgent(context: PackageContext) {
  const extraInstructions = await reforge.promptInput({
    title: "Extra instructions",
    placeHolder: "(optional)",
    prompt: "Provide any additional instructions for the README.md file.",
  });
  const packageDir = context.focusedFile.dir();
  const srcFiles = await packageDir.glob("**/*.ts");
  const readmeFiles = await rootDir.glob(
    "**/packages/*/*.md",
    "!" + context.focusedFile.relativePathFrom(rootDir),
  );

  const prompt = [
    systemMsg`
      Write the README.md file for one of the packages of a monorepo workspace:
      - Use the provided sample source files to understand the context of the current package and other README.md files to as a reference of the expected output.
      - When <instructions/> tags are present in the current README.md file, take them into account when updating it.
      - If the current README.md is missing elements from the API, add them.
      - Omit documentation about exported types.
    `,
    userMsg`
      # Objective
      Write the README.md file for ${context.packageName}

      # Context

      ## Current README.md file
      ${fileToPrompt(context.focusedFile)}

      ## Source files
      ${srcFiles.map((f) => fileToPrompt(f))}

      ## README.md files
      ${readmeFiles.map((f) => fileToPrompt(f))}

      ${tIf(extraInstructions)`
        # Extra instructions
        ${extraInstructions}
      `}

      # Expected output
      Update the README.md file for ${context.packageName}
    `,
    assistantMsg`
      <file path="${context.focusedFile.relativePathFrom(rootDir)}">
    `,
  ];

  console.log("Writing README.md file for ", context.packageName);
  console.log("Relative path: ", context.focusedFile.relativePathFrom(rootDir));

  await fileAgent(prompt);
}
