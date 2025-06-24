import { z } from "zod/v4";
import { toolFactory } from "./tool.utils.ts";

export const getFocusedFileConfig = {
  name: "GET_FOCUSED_FILE",
  requestSchema: null,
  responseSchema: z.string().nullable(),
} as const;

/**
 * Retrieve the absolute path to the actively focused file in the editor
 */
export const getFocusedFile = toolFactory(getFocusedFileConfig);

export const getOpenedFilesConfig = {
  name: "GET_OPENED_FILES",
  requestSchema: null,
  responseSchema: z.array(z.string()),
} as const;

// TODO: Return a list of FsFile instances
/**
 * Retrieve the absolute paths to all opened files in the editor
 *
 * @warning this list also includes the focused file
 */
export const getOpenedFiles = toolFactory(getOpenedFilesConfig);

export const promptSelectConfig = {
  name: "PROMPT_SELECT",
  requestSchema: z.object({
    /**
     * The title of the prompt
     */
    title: z.string().optional(),
    /**
     * The options to display in the prompt
     */
    options: z.array(z.string()),
    /**
     * The placeholder text to display in the prompt
     */
    placeHolder: z.string().optional(),
  }),
  responseSchema: z.string().nullable(),
} as const;

// TODO: Provide a complete API for choices
/**
 * Prompts the user to select an option from a list of options
 * @returns The selected option or null if the user cancels the prompt
 */
export const promptSelect = toolFactory(promptSelectConfig);

export const promptInputConfig = {
  name: "PROMPT_INPUT",
  requestSchema: z.object({
    /**
     * The title of the prompt
     */
    title: z.string().optional(),
    /**
     * The prompt to display in the prompt
     */
    prompt: z.string().optional(),
    /**
     * The placeholder text to display in the prompt
     */
    placeHolder: z.string().optional(),
    /**
     * The default input value
     */
    defaultValue: z.string().optional(),
    /**
     * Whether the input should be a password and masked
     */
    isPassword: z.boolean().optional().default(false),
  }),
  responseSchema: z.string().nullable(),
} as const;

/**
 * Prompts the user to input a value
 * @returns The input value or null if the user cancels the prompt
 */
export const promptInput = toolFactory(promptInputConfig);

export const promptMultiSelectConfig = {
  name: "PROMPT_MULTI_SELECT",
  requestSchema: z.object({
    /**
     * The title of the prompt
     */
    title: z.string().optional(),
    /**
     * The options to display in the prompt
     */
    options: z.array(z.string()),
    /**
     * The placeholder text to display in the prompt
     */
    placeHolder: z.string().optional(),
  }),
  responseSchema: z.array(z.string()),
} as const;

// TODO: Provide a complete API for choices
/**
 * Prompts the user to select multiple options from a list of options
 * @returns The selected options as an array
 */
export const promptMultiSelect = toolFactory(promptMultiSelectConfig);

export const notifyConfig = {
  name: "NOTIFY",
  requestSchema: z.object({
    /**
     * The title of the notification
     */
    title: z.string().optional(),
    /**
     * The message to display in the notification
     */
    message: z.string(),
    /**
     * The type of notification
     * @default info
     * @argument info - Informational notification
     * @argument warning - Warning notification
     * @argument error - Error notification
     */
    type: z.enum(["info", "warning", "error"]).optional().default("info"),
    /**
     * Buttons values to display in the notification
     */
    buttons: z.array(z.string()).optional(),
  }),
  responseSchema: z.string().nullable(),
} as const;

/**
 * Displays a notification to the user
 * @returns the button clicked by the user or null if the user dismissed the notification
 */
export const notify = toolFactory(notifyConfig);

const openFileRequest = z
  .object({
    /**
     * @default false
     * Whether to force the file to open even if it is already open
     */
    force: z.boolean().default(false),
    /**
     * Whether to preview the file in the editor
     * @default false
     * @warning Check if the file type is supported by the editor
     */
    preview: z.boolean().optional().default(false),
    /**
     * The column to open the file in
     * @default active
     * @argument active - Open the file in the active column
     * @argument beside - Open the file beside the active column
     * @argument N - Open the file in the Nth column
     */
    column: z
      .union([z.enum(["active", "beside"]), z.number().min(1).max(9)])
      .optional(),
  })
  .default({
    force: false,
    preview: false,
    column: "active",
  });

const openFileResponse = z.object({
  /**
   * Absolute path to the file
   */
  path: z.string(),
  /**
   * Whether the file is already open in the editor
   */
  isAlreadyOpened: z.boolean(),
});

export const openFileConfig = {
  name: "OPEN_FILE",
  requestSchema: z.object({
    /**
     * Absolute path to the file
     */
    path: z.string(),
    config: openFileRequest,
  }),
  responseSchema: openFileResponse,
};

/**
 * Opens a file in the editor
 */
export const openFile = toolFactory(openFileConfig);

export const openFilesConfig = {
  name: "OPEN_FILES",
  requestSchema: z.object({
    /**
     * Array of absolute paths to the files to open
     */
    paths: z.array(z.string()),
    config: openFileRequest,
  }),
  /**
   * Array of absolute paths to the files & whether they were already open in the editor
   */
  responseSchema: z.array(openFileResponse),
};

export const openFiles = toolFactory(openFilesConfig);

const selectionPositionSchema = z.object({
  /**
   * The position in the whole file
   */
  character: z.number(),
  /**
   * The line number of the position
   */
  line: z.number(),
  /**
   * The character position within the line
   */
  lineCharacter: z.number(),
});

export const getFocusedFileSelectionsConfig = {
  name: "GET_FOCUSED_FILE_SELECTION",
  requestSchema: null,
  responseSchema: z
    .object({
      /**
       * Absolute path to the file
       */
      path: z.string(),
      /**
       * Array of active selections in the file
       */
      selections: z.array(
        z.object({
          /**
           * The starting character position of the selection in the file
           */
          start: selectionPositionSchema,
          /**
           * The ending character position of the selection in the file
           */
          end: selectionPositionSchema,
          /**
           * The string content of the selection
           */
          content: z.string(),
          /**
           * The length of the selection
           */
          length: z.number(),
        }),
      ),
    })
    .nullable(),
};

/**
 * Retrieve the active selections in the actively focused file in the editor
 */
export const getFocusedFileSelections = toolFactory(
  getFocusedFileSelectionsConfig,
);

export const getPinnedFilesConfig = {
  name: "GET_PINNED_FILES",
  requestSchema: null,
  responseSchema: z.array(z.string()),
};

/**
 * Retrieve the list of pinned files in the editor
 * @returns The list of pinned files
 */
export const getPinnedFiles = toolFactory(getPinnedFilesConfig);

export const pinFilesConfig = {
  name: "PIN_FILES",
  requestSchema: z.object({
    paths: z.array(z.string()),
  }),
  responseSchema: z.array(z.string()),
};

/**
 * Pin a list of files in the editor
 * @returns The list of pinned files
 */
export const pinFiles = toolFactory(pinFilesConfig);

export const unpinFilesConfig = {
  name: "UNPIN_FILES",
  requestSchema: z.object({
    paths: z.array(z.string()),
  }),
  responseSchema: z.array(z.string()),
};

/**
 * Unpin a list of files in the editor
 * @returns The list of pinned files
 */
export const unpinFiles = toolFactory(unpinFilesConfig);
