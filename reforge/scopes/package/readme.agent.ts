/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { assistantMsg, systemMsg, userMsg } from "@synstack/llm";
import { reforge } from "@synstack/reforge";
import { t } from "@synstack/text";
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
      - Check for any missing feature or removed features in the current README.md file and update it accordingly.
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

      ${
        extraInstructions &&
        t`
          # Extra instructions
          ${extraInstructions}
        `
      }

      # Expected output
      The updated README.md file for ${context.packageName} in a <file/> tag.
    `,
    assistantMsg`
      <file path="${context.focusedFile.relativePathFrom(rootDir)}">
    `,
  ];

  console.log("Writing README.md file for ", context.packageName);
  console.log("Relative path: ", context.focusedFile.relativePathFrom(rootDir));

  await fileAgent(prompt);
}
