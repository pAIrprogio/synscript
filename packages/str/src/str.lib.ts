/**
 * Remove empty lines at the start of the text but leave whitespace on the first line with content
 * @param text - The input string to process
 * @returns The string with empty lines removed from the start
 * @example
 * ```typescript
 * chopEmptyLinesStart("\n\n  \n  Hello")  // "  Hello"
 * chopEmptyLinesStart("  Hello")          // "  Hello"
 * ```
 */
export const chopEmptyLinesStart = (text: string) => {
  return text.replace(/^(\s*\n)+/, "");
};

/**
 * Remove empty lines at the end of the text but leave whitespace on the last line with content
 * @param text - The input string to process
 * @returns The string with empty lines removed from the end
 * @example
 * ```typescript
 * chopEmptyLinesEnd("Hello\n\n  \n")  // "Hello"
 * chopEmptyLinesEnd("Hello  ")        // "Hello  "
 * ```
 */
export const chopEmptyLinesEnd = (text: string) => {
  return text.replace(/(\n\s*)+$/, "");
};

/**
 * Remove all space characters in lines that contain no content
 * @param text - The input string to process
 * @returns The string with whitespace removed from empty lines
 * @example
 * ```typescript
 * trimEmptyLines("Hello\n   \nWorld")  // "Hello\n\nWorld"
 * trimEmptyLines("  \n  \n  ")        // "\n\n"
 * ```
 */
export const trimEmptyLines = (text: string) => {
  return text.replace(/(^|\n)\s+(\n|$)/g, "$1$2");
};

/**
 * Remove all space characters at the end of each line
 * @param text - The input string to process
 * @returns The string with trailing spaces removed from all lines
 * @example
 * ```typescript
 * trimLinesTrailingSpaces("Hello  \nWorld   ")  // "Hello\nWorld"
 * trimLinesTrailingSpaces("Hello   ")          // "Hello"
 * ```
 */
export const trimLinesTrailingSpaces = (text: string) => {
  return text.replace(/ +(\n|$)/g, "$1");
};

/**
 * Remove leading and trailing whitespace and line terminator characters
 * @param text - The input string to process
 * @returns The trimmed string
 * @example
 * ```typescript
 * trim("  Hello World  ")  // "Hello World"
 * trim("\n  Hello  \n")   // "Hello"
 * ```
 */
export const trim = (text: string) => {
  return text.trim();
};

/**
 * Remove leading whitespace and line terminator characters
 * @param text - The input string to process
 * @returns The string with leading whitespace removed
 * @example
 * ```typescript
 * trimStart("  Hello World  ")  // "Hello World  "
 * trimStart("\n  Hello")       // "Hello"
 * ```
 */
export const trimStart = (text: string) => {
  return text.trimStart();
};

/**
 * Remove trailing whitespace and line terminator characters
 * @param text - The input string to process
 * @returns The string with trailing whitespace removed
 * @example
 * ```typescript
 * trimEnd("  Hello World  ")  // "  Hello World"
 * trimEnd("Hello  \n")       // "Hello"
 * ```
 */
export const trimEnd = (text: string) => {
  return text.trimEnd();
};

/**
 * Split a string into substrings using the specified separator
 * @param text - The input string to split
 * @param separator - The string or regular expression to use for splitting
 * @param limit - Optional limit on the number of splits to perform
 * @returns An array of substrings
 * @example
 * ```typescript
 * split("Hello World", " ")      // ["Hello", "World"]
 * split("a,b,c", ",", 2)        // ["a", "b"]
 * split("a.b-c", /[.-]/)        // ["a", "b", "c"]
 * ```
 */
export const split = (
  text: string,
  separator: string | RegExp,
  limit?: number,
) => {
  return text.split(separator, limit);
};

/**
 * Add line numbers to each line in a string
 * @param text - The string to add line numbers to
 * @param separator - The separator between line number and content (defaults to ":")
 * @returns The string with line numbers added
 * @example
 * ```typescript
 * addLineNumbers("Hello\nWorld")           // "0:Hello\n1:World"
 * addLineNumbers("A\nB\nC", " -> ")       // "0 -> A\n1 -> B\n2 -> C"
 * ```
 */
export const addLineNumbers = (text: string, separator: string = ":") => {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line, index) => `${index}${separator}${line}`)
    .join("\n");
};

/**
 * Calculate the minimum indentation level of non-empty lines in the string
 * @param text - The input string to analyze
 * @returns The number of spaces in the minimum indentation level, or 0 if no indentation found
 * @example
 * ```typescript
 * indentation("  Hello\n    World")  // 2
 * indentation("Hello\n  World")      // 0
 * indentation("  \n    Hello")       // 4
 * ```
 */
export const indentation = (text: string) => {
  return (
    text.split(/\r?\n/).reduce((acc: number | null, line) => {
      if (line.trim() === "") return acc;
      const indentation = leadingSpacesCount(line);
      if (acc === null) return indentation;
      return Math.min(acc, indentation);
    }, null) ?? 0
  );
};

/**
 * Indent each line of the string by a specified number of spaces
 * @param text - The input string to indent
 * @param size - The number of spaces to add at the start of each line
 * @param char - The character to use for indentation (defaults to space)
 * @returns The indented string
 * @example
 * ```typescript
 * indent("Hello\nWorld", 2)        // "  Hello\n  World"
 * indent("A\nB", 3, "-")          // "---A\n---B"
 * ```
 */
export const indent = (text: string, size: number, char: string = " ") => {
  if (size === 0) return text;

  const indentStr = char.repeat(size);
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => indentStr + line)
    .join("\n");
};

/**
 * Remove indentation from each line of the string
 * @param text - The input string to dedent
 * @param size - Optional number of spaces to remove. If not provided, removes the minimum common indentation
 * @returns The dedented string
 * @example
 * ```typescript
 * dedent("  Hello\n    World")     // "Hello\n  World"
 * dedent("    A\n  B", 2)         // "  A\nB"
 * ```
 */
export const dedent = (text: string, size?: number) => {
  const _size = size ?? indentation(text);
  if (_size === 0) return text;
  const regex = new RegExp(`^\\s{1,${_size}}`);
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => line.replace(regex, ""))
    .join("\n");
};

/**
 * Remove a specified number of characters from the end of the string
 * @param text - The input string to process
 * @param count - The number of characters to remove
 * @returns The string with characters removed from the end
 * @example
 * ```typescript
 * chopEnd("Hello World", 6)  // "Hello"
 * chopEnd("Hello", 0)        // "Hello"
 * ```
 */
export const chopEnd = (text: string, count: number) => {
  if (count === 0) return text;
  return text.slice(0, -count);
};

/**
 * Remove a specified number of characters from the start of the string
 * @param text - The input string to process
 * @param count - The number of characters to remove
 * @returns The string with characters removed from the start
 * @example
 * ```typescript
 * chopStart("Hello World", 6)  // "World"
 * chopStart("Hello", 0)        // "Hello"
 * ```
 */
export const chopStart = (text: string, count: number) => {
  if (count === 0) return text;
  return text.slice(count);
};

/**
 * Limit the number of consecutive newlines in the string
 * @param text - The input string to process
 * @param maxRepeat - The maximum number of consecutive newlines to allow
 * @returns The string with consecutive newlines limited
 * @example
 * ```typescript
 * chopRepeatNewlines("A\n\n\n\nB", 2)  // "A\n\nB"
 * chopRepeatNewlines("A\n\nB", 1)      // "A\nB"
 * ```
 */
export const chopRepeatNewlines = (text: string, maxRepeat: number) => {
  if (maxRepeat === 0) return text;
  return text.replace(
    new RegExp(`\n{${maxRepeat + 1},}`, "g"),
    "\n".repeat(maxRepeat),
  );
};

/**
 * Extract a specified number of characters from the start of the string
 * @param text - The input string to process
 * @param count - The number of characters to take
 * @returns The extracted substring from the start
 * @example
 * ```typescript
 * takeStart("Hello World", 5)  // "Hello"
 * takeStart("Hi", 5)           // "Hi"
 * ```
 */
export const takeStart = (text: string, count: number) => {
  return text.slice(0, count);
};

/**
 * Extract a specified number of characters from the end of the string
 * @param text - The input string to process
 * @param count - The number of characters to take
 * @returns The extracted substring from the end
 * @example
 * ```typescript
 * takeEnd("Hello World", 5)  // "World"
 * takeEnd("Hi", 5)           // "Hi"
 * ```
 */
export const takeEnd = (text: string, count: number) => {
  return text.slice(-count);
};

/**
 * Get the last line of a multi-line string
 * @param text - The input string to process
 * @returns The last line of the string, or empty string if input is empty
 * @example
 * ```typescript
 * lastLine("Hello\nWorld")  // "World"
 * lastLine("Hello")         // "Hello"
 * lastLine("")             // ""
 * ```
 */
export const lastLine = (text: string) => {
  return text.split(/\r?\n/).at(-1) ?? "";
};

/**
 * Get the first line of a multi-line string
 * @param text - The input string to process
 * @returns The first line of the string, or empty string if input is empty
 * @example
 * ```typescript
 * firstLine("Hello\nWorld")  // "Hello"
 * firstLine("Hello")         // "Hello"
 * firstLine("")             // ""
 * ```
 */
export const firstLine = (text: string) => {
  return text.split(/\r?\n/).at(0) ?? "";
};

/**
 * Count the number of leading space characters in a string
 * @param text - The input string to analyze
 * @returns The number of leading space characters
 * @example
 * ```typescript
 * leadingSpacesCount("  Hello")  // 2
 * leadingSpacesCount("Hello")    // 0
 * ```
 */
export const leadingSpacesCount = (text: string) => {
  return text.match(/^\s+/)?.at(0)?.length ?? 0;
};

/**
 * Check if a string is empty or contains only whitespace
 * @param text - The input string to check
 * @returns True if the string is empty or contains only whitespace, false otherwise
 * @example
 * ```typescript
 * isEmpty("")         // true
 * isEmpty("  \n  ")  // true
 * isEmpty("Hello")   // false
 * ```
 */
export const isEmpty = (text: string) => {
  return text.trim() === "";
};

/**
 * Replace the first occurrence of a substring or pattern in the string
 * @param text - The input string to process
 * @param searchValue - The string or pattern to search for
 * @param replaceValue - The string to replace the match with
 * @returns The string with the first match replaced
 * @example
 * ```typescript
 * replace("Hello World", "o", "0")     // "Hell0 World"
 * replace("abc abc", /[a-z]/, "X")     // "Xbc abc"
 * ```
 */
export const replace = (
  text: string,
  searchValue: string | RegExp,
  replaceValue: string,
) => {
  return text.replace(searchValue, replaceValue);
};

/**
 * Replace all occurrences of a substring or pattern in the string
 * @param text - The input string to process
 * @param searchValue - The string or pattern to search for
 * @param replaceValue - The string to replace the matches with
 * @returns The string with all matches replaced
 * @example
 * ```typescript
 * replaceAll("Hello World", "o", "0")     // "Hell0 W0rld"
 * replaceAll("abc abc", /[a-z]/g, "X")    // "XXX XXX"
 * ```
 */
export const replaceAll = (
  text: string,
  searchValue: string | RegExp,
  replaceValue: string,
) => {
  if (typeof searchValue === "string") {
    return text.replaceAll(searchValue, replaceValue);
  }
  // Ensure the RegExp has the global flag
  const flags = searchValue.flags.includes("g")
    ? searchValue.flags
    : searchValue.flags + "g";
  const globalRegex = new RegExp(searchValue.source, flags);
  return text.replace(globalRegex, replaceValue);
};
