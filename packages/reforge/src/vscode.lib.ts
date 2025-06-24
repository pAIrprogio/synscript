import { z } from "zod/v4";
import { toolFactory } from "./tool.utils.ts";

/**
 * Enumeration of VSCode symbol kinds.
 * These values represent different types of symbols that can be found in code.
 */
export const VscodeSymbolKind = {
  File: 0,
  Module: 1,
  Namespace: 2,
  Package: 3,
  Class: 4,
  Method: 5,
  Property: 6,
  Field: 7,
  Constructor: 8,
  Enum: 9,
  Interface: 10,
  Function: 11,
  Variable: 12,
  Constant: 13,
  String: 14,
  Number: 15,
  Boolean: 16,
  Array: 17,
  Object: 18,
  Key: 19,
  Null: 20,
  EnumMember: 21,
  Struct: 22,
  Event: 23,
  Operator: 24,
  TypeParameter: 25,
} as const;

/**
 * Enumeration of VSCode symbol tags.
 * These values represent additional metadata that can be attached to symbols.
 */
export const VscodeSymbolTag = {
  Deprecated: 1,
} as const;

/**
 * Schema for a position in a text document.
 */
export const positionSchema = z.object({
  /** Zero-based line number */
  line: z.number().int().min(0),
  /** Zero-based character offset on the line */
  character: z.number().int().min(0),
});

/** Type representing a position in a text document */
export type Position = z.output<typeof positionSchema>;

/**
 * Schema for a range in a text document.
 */
export const rangeSchema = z.object({
  /** The start position of the range */
  start: positionSchema,
  /** The end position of the range */
  end: positionSchema,
});

/** Type representing a range in a text document */
export type Range = z.output<typeof rangeSchema>;

/**
 * Schema for a call hierarchy item.
 * Represents a programming construct that can be part of a call hierarchy.
 */
export const callHierarchyItemSchema = z.object({
  /** The symbol kind of the item */
  kind: z.number().int().min(0).max(25),
  /** The name of the item */
  name: z.string(),
  /** Additional details about the item */
  detail: z.string(),
  /** The URI of the document containing the item */
  uri: z.string(),
  /** Optional tags associated with the item */
  tags: z.array(z.number().int()).optional(),
  /** The full range of the item */
  range: rangeSchema,
  /** The range that should be selected when navigating to the item */
  selectionRange: rangeSchema,
});

/** Type representing a call hierarchy item */
export type CallHierarchyItem = z.output<typeof callHierarchyItemSchema>;

/**
 * Configuration for the executeCommand tool.
 * Defines the schema for executing VSCode commands.
 */
export const executeCommandConfig = {
  name: "EXECUTE_COMMAND",
  requestSchema: z.object({
    /** The vscode command to execute */
    command: z.string(),
    /** List of args to be passed to the command */
    args: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("path"),
            value: z.string(),
          }),
          z.object({
            type: z.literal("Uri"),
            value: z.string().describe("Absolute path to the file"),
          }),
          z.object({
            type: z.literal("Range"),
            value: rangeSchema,
          }),
          z.object({
            type: z.literal("Position"),
            value: positionSchema,
          }),
          z.object({
            type: z.literal("CallHierarchyItem"),
            value: callHierarchyItemSchema,
          }),
          z.object({
            type: z.literal("primitive"),
            value: z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.record(z.string(), z.any()),
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
 * Executes a command in the VSCode editor.
 * Allows calling bundled VSCode commands as well as commands from other extensions.
 *
 * @template OUTPUT - The expected output type of the command
 * @param {z.input<typeof executeCommandConfig.requestSchema>} args - The command arguments
 * @returns {Promise<OUTPUT>} A promise that resolves with the command's output
 */
export const executeCommand = toolFactory(executeCommandConfig) as <
  OUTPUT = any,
>(
  args: z.input<typeof executeCommandConfig.requestSchema>,
) => Promise<OUTPUT>;
