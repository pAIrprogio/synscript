import { Pipeable } from "@synstack/pipe";
import * as changeCase from "change-case";
import * as lib from "./str.lib";

export type Stringable = {
  toString: () => string;
};

export class Str extends Pipeable<Str, string> {
  public constructor(private readonly text: string) {
    super();
  }

  public valueOf(): string {
    return this.text;
  }

  public toString() {
    return this.text;
  }

  public instanceOf(): Str {
    return this;
  }

  /**
   * Remove empty lines at the start of the text but leave whitespace on the first line with content
   */
  public chopEmptyLinesStart() {
    return new Str(lib.chopEmptyLinesStart(this.text));
  }

  /**
   * Remove empty lines at the end of the text but leave whitespace on the last line with content
   */
  public chopEmptyLinesEnd() {
    return new Str(lib.chopEmptyLinesEnd(this.text));
  }

  /**
   * Remove all space (\s) characters in lines without content
   */
  public trimEmptyLines() {
    return new Str(lib.trimEmptyLines(this.text));
  }

  /**
   * Remove all spaces (\s) characters at the end of lines
   */
  public trimLinesTrailingSpaces() {
    return new Str(lib.trimLinesTrailingSpaces(this.text));
  }

  /**
   * Removes the leading and trailing white space and line terminator characters
   */
  public trim() {
    return new Str(lib.trim(this.text));
  }

  /**
   * Removes the leading white space and line terminator characters
   */
  public trimStart() {
    return new Str(lib.trimStart(this.text));
  }

  /**
   * Removes the trailing white space and line terminator characters
   */
  public trimEnd() {
    return new Str(lib.trimEnd(this.text));
  }

  /**
   * Split a string into substrings using the specified separator and return them as an array
   */
  public split(separator: string | RegExp, limit?: number) {
    return lib.split(this.text, separator, limit).map((v) => new Str(v));
  }

  /**
   * Add line numbers to a string
   * @param separator The separator to use between the line number and the line content.
   * Defaults to ":"
   */
  public addLineNumbers(separator: string = ":") {
    return new Str(lib.addLineNumbers(this.text, separator));
  }

  /**
   * Returns the character at the specified index
   * @return string or undefined if the index is out of bounds
   */
  public at(index: number) {
    return this.text.at(index);
  }

  /**
   * Returns the length of the string
   */
  public length() {
    return this.text.length;
  }

  /**
   * Indent the string by the specified number of spaces
   * @param size The number of spaces to indent by
   * @param char The character to use for indentation. Defaults to " "
   */
  public indent(size: number, char: string = " ") {
    return new Str(lib.indent(this.text, size, char));
  }

  /**
   * Dedent the string by the specified number of spaces
   * @param indentation The number of spaces to dedent by.
   * If not provided, it will be calculated automatically based on the maximum indentation in the string.
   */
  public dedent(indentation?: number) {
    return new Str(lib.dedent(this.text, indentation));
  }

  /**
   * Chop the string at the start by the specified number of characters
   */
  public chopStart(count: number) {
    return new Str(lib.chopStart(this.text, count));
  }

  /**
   * Chop the string at the end by the specified number of characters
   */
  public chopEnd(count: number) {
    if (count === 0) return this;
    return new Str(lib.chopEnd(this.text, count));
  }

  /**
   * Remove successive newlines of the specified repetition or more
   * @param maxRepeat the maximum number of newlines to allow
   */
  public chopRepeatNewlines(maxRepeat: number) {
    if (maxRepeat === 0) return this;
    return new Str(lib.chopRepeatNewlines(this.text, maxRepeat));
  }

  /**
   * Take the first n characters of the string
   */
  public takeStart(count: number) {
    return new Str(lib.takeStart(this.text, count));
  }

  /**
   * Take the last n characters of the string
   */
  public takeEnd(count: number) {
    return new Str(lib.takeEnd(this.text, count));
  }

  /**
   * Returns the last line of the string
   */
  public lastLine() {
    return new Str(lib.lastLine(this.text));
  }

  /**
   * Returns the first line of the string
   */
  public firstLine() {
    return new Str(lib.firstLine(this.text));
  }

  /**
   * Returns the number of leading spaces in the string
   */
  public leadingSpacesCount() {
    return lib.leadingSpacesCount(this.text);
  }

  /**
   * Returns the indentation level of the string skipping empty lines in the process
   */
  public indentation() {
    return lib.indentation(this.text);
  }

  /**
   * Returns true if the string is empty or contains only whitespace
   */
  public isEmpty() {
    return lib.isEmpty(this.text);
  }

  /**
   * Converts the string to camel case
   */
  public camelCase() {
    return new Str(changeCase.camelCase(this.text));
  }

  /**
   * Converts the string to capital case
   */
  public capitalCase() {
    return new Str(changeCase.capitalCase(this.text));
  }

  /**
   * Converts the string to constant case
   */
  public constantCase() {
    return new Str(changeCase.constantCase(this.text));
  }

  /**
   * Converts the string to dot case
   */
  public dotCase() {
    return new Str(changeCase.dotCase(this.text));
  }

  /**
   * Converts the string to kebab case
   */
  public kebabCase() {
    return new Str(changeCase.kebabCase(this.text));
  }

  /**
   * Converts the string to no case
   */
  public noCase() {
    return new Str(changeCase.noCase(this.text));
  }

  /**
   * Converts the string to pascal case
   */
  public pascalCase() {
    return new Str(changeCase.pascalCase(this.text));
  }

  /**
   * Converts the string to pascal snake case
   */
  public pascalSnakeCase() {
    return new Str(changeCase.pascalSnakeCase(this.text));
  }

  /**
   * Converts the string to path case
   */
  public pathCase() {
    return new Str(changeCase.pathCase(this.text));
  }

  /**
   * Converts the string to sentence case
   */
  public sentenceCase() {
    return new Str(changeCase.sentenceCase(this.text));
  }

  /**
   * Converts the string to snake case
   */
  public snakeCase() {
    return new Str(changeCase.snakeCase(this.text));
  }

  /**
   * Converts the string to train case
   */
  public trainCase() {
    return new Str(changeCase.trainCase(this.text));
  }

  /**
   * Shorthand for `.toString()`
   */
  public get str() {
    return this.toString();
  }
}

export const str = (text: Stringable) => {
  return new Str(text.toString());
};
