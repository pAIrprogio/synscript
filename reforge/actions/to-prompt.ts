import { reforge } from "@synstack/synscript";
import { systemMsg, userMsg } from "@synstack/synscript/llm";
import { getRuntimeContext } from "../runtime/context.runtime.ts";

async function main() {
  const runtimeContext = await getRuntimeContext();
  const { openedFiles } = runtimeContext;

  const extraInstructions = reforge.promptInput({
    placeHolder: "Extra instructions",
    prompt: "Enter any extra instructions for the prompt",
  });

  const prompt = [
    systemMsg`Based on the <file/> and <instruction/> provided, write a prompt to help an LLM achieve the required task.`,
    userMsg`
      # Context

    
    `,
  ];
}

await main().then(() => {
  console.log("Done");
  // Force IPC to close
  process.exit(0);
});
