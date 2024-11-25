import { z } from "zod";
import { toolFactory } from "./tool.utils";

export const executeCommandConfig = {
  name: "EXECUTE_COMMAND",
  requestSchema: z.object({
    /**
     * The vscode command to execute
     */
    command: z.string(),
    /**
     * List of args to be passed to the command
     */
    args: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            /**
             * Transforms the value provided in `path` into a valid Uri instance
             */
            type: z.literal("path"),
            /**
             * The absolute path to the file
             */
            value: z.string(),
          }),
          z.object({
            /**
             * Any other value to pass to the command
             */
            type: z.literal("primitive"),
            value: z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.record(z.any()),
              z.array(z.any()),
            ]),
          }),
        ]),
      )
      .optional()
      .default([]),
  }),
  responseSchema: z.any().optional(),
};

/**
 * Executes a command in the vscode editor
 *
 * Allows calling bundled vscode commands as well as commands from other extensions
 */
export const executeCommand = toolFactory(executeCommandConfig);
