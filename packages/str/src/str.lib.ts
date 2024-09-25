/**
 * Remove empty lines at the start of the text but leave whitespace on the first line with content
 */
export const chopEmptyLinesStart = (text: string) => {
  return text.replace(/^(\s*\n)+/, "");
};

/**
 * Remove empty lines at the end of the text but leave whitespace on the last line with content
 */
export const chopEmptyLinesEnd = (text: string) => {
  return text.replace(/(\n\s*)+$/, "");
};

/**
 * Remove all space (\s) characters in lines without content
 */
export const trimEmptyLines = (text: string) => {
  return text.replace(/(^|\n)\s+(\n|$)/g, "$1$2");
};

/**
 * Remove all space (\s) characters at the end of lines
 */
export const trimLinesTrailingSpaces = (text: string) => {
  return text.replace(/ +(\n|$)/g, "$1");
};

/**
 * Removes the leading and trailing white space and line terminator characters
 */
export const trim = (text: string) => {
  return text.trim();
};

/**
 * Removes the leading white space and line terminator characters
 */
export const trimStart = (text: string) => {
  return text.trimStart();
};

/**
 * Removes the trailing white space and line terminator characters
 */
export const trimEnd = (text: string) => {
  return text.trimEnd();
};

/**
 * Split a string into substrings using the specified separator and return them as an array
 */
export const split = (
  text: string,
  separator: string | RegExp,
  limit?: number,
) => {
  return text.split(separator, limit);
};

/**
 * Add line numbers to a string
 * @param text The string to add line numbers to
 * @param separator The separator to use between the line number and the line content.
 * Defaults to ":"
 */
export const addLineNumbers = (text: string, separator: string = ":") => {
  return text
    .split("\n")
    .map((line, index) => `${index}${separator}${line}`)
    .join("\n");
};

/**
 * Returns the indentation level of the string skipping empty lines in the process
 */
export const indentation = (text: string) => {
  return (
    text.split("\n").reduce((acc: number | null, line) => {
      if (line.trim() === "") return acc;
      const indentation = leadingSpacesCount(line);
      if (acc === null) return indentation;
      return Math.min(acc, indentation);
    }, null) ?? 0
  );
};

/**
 * Indent the string by the specified number of spaces
 * @param size The number of spaces to indent by
 * @param char The character to use for indentation. Defaults to " "
 */
export const indent = (text: string, size: number, char: string = " ") => {
  if (size === 0) return text;

  const indentStr = char.repeat(size);
  return text
    .split("\n")
    .map((line) => indentStr + line)
    .join("\n");
};

/**
 * Dedent the string by the specified number of spaces
 * @param indentation The number of spaces to dedent by.
 * If not provided, it will be calculated automatically based on the maximum indentation in the string.
 */
export const dedent = (text: string, size?: number) => {
  const _size = size ?? indentation(text);
  if (_size === 0) return text;
  const regex = new RegExp(`^\\s{1,${_size}}`);
  return text
    .split("\n")
    .map((line) => line.replace(regex, ""))
    .join("\n");
};

/**
 * Chop the string at the end by the specified number of characters
 */
export const chopEnd = (text: string, count: number) => {
  if (count === 0) return text;
  return text.slice(0, -count);
};

/**
 * Chop the string at the start by the specified number of characters
 */
export const chopStart = (text: string, count: number) => {
  if (count === 0) return text;
  return text.slice(count);
};

/**
 * Remove successive newlines of the specified repetition or more
 * @param maxRepeat the maximum number of newlines to allow
 */
export const chopRepeatNewlines = (text: string, maxRepeat: number) => {
  if (maxRepeat === 0) return text;
  return text.replace(
    new RegExp(`\n{${maxRepeat + 1},}`, "g"),
    "\n".repeat(maxRepeat),
  );
};

/**
 * Take the first n characters of the string
 */
export const takeStart = (text: string, count: number) => {
  return text.slice(0, count);
};

/**
 * Take the last n characters of the string
 */
export const takeEnd = (text: string, count: number) => {
  return text.slice(-count);
};

/**
 * Returns the last line of the string
 */
export const lastLine = (text: string) => {
  return text.split("\n").at(-1) ?? "";
};

/**
 * Returns the first line of the string
 */
export const firstLine = (text: string) => {
  return text.split("\n").at(0) ?? "";
};

/**
 * Returns the number of leading spaces in the string
 */
export const leadingSpacesCount = (text: string) => {
  return text.match(/^\s+/)?.at(0)?.length ?? 0;
};

/**
 * Returns true if the string is empty or contains only whitespace
 */
export const isEmpty = (text: string) => {
  return text.trim() === "";
};
