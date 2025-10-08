import { Pipeable } from "@synstack/pipe";
import * as changeCase from "change-case";
import { type Stringable } from "../../shared/src/ts.utils.ts";
import * as lib from "./str.lib.ts";

/**
 * A chainable string manipulation class that extends Pipeable
 * Provides a fluent interface for string operations with full TypeScript support
 *
 * @example
 * ```typescript
 * import { str } from '@synstack/str'
 *
 * // Basic chaining
 * const result = str('Hello World')
 *   .trim()
 *   .split(' ')
 *   .at(0)
 *   .$
 *
 * // Advanced chaining with Pipeable methods
 * const modified = str('hello-world')
 *   ._((s) => s.camelCase())
 *   ._$((value) => value.toUpperCase())
 *   .$
 * ```
 */
export class Str extends Pipeable<Str, string> {
  private readonly text: string;

  /**
   * Create a new Str instance
   * @param text - The input string to wrap
   * @example
   * ```typescript
   * const s = new Str('Hello World')
   * // or use the convenience function
   * const s = str('Hello World')
   * ```
   */
  public constructor(text: string) {
    super();
    this.text = text.replace(/\r\n/g, "\n");
  }

  /**
   * Get the underlying string value
   * @returns The wrapped string value
   */
  public valueOf(): string {
    return this.text;
  }

  /**
   * Convert the Str instance to a string
   * @returns The wrapped string value
   */
  public toString() {
    return this.text;
  }

  /**
   * Get the current Str instance
   * @returns The current Str instance
   * @internal Used by Pipeable
   */
  public instanceOf(): Str {
    return this;
  }

  /**
   * Remove empty lines at the start of the text
   * @returns A new Str instance with empty lines removed from the start
   * @example
   * ```typescript
   * str('\n\n  Hello').chopEmptyLinesStart().$  // '  Hello'
   * ```
   */
  public chopEmptyLinesStart() {
    return new Str(lib.chopEmptyLinesStart(this.text));
  }

  /**
   * Remove empty lines at the end of the text
   * @returns A new Str instance with empty lines removed from the end
   * @example
   * ```typescript
   * str('Hello\n\n').chopEmptyLinesEnd().$  // 'Hello'
   * ```
   */
  public chopEmptyLinesEnd() {
    return new Str(lib.chopEmptyLinesEnd(this.text));
  }

  /**
   * Remove whitespace from empty lines
   * @returns A new Str instance with whitespace removed from empty lines
   * @example
   * ```typescript
   * str('Hello\n   \nWorld').trimEmptyLines().$  // 'Hello\n\nWorld'
   * ```
   */
  public trimEmptyLines() {
    return new Str(lib.trimEmptyLines(this.text));
  }

  /**
   * Remove trailing spaces from all lines
   * @returns A new Str instance with trailing spaces removed from all lines
   * @example
   * ```typescript
   * str('Hello  \nWorld  ').trimLinesTrailingSpaces().$  // 'Hello\nWorld'
   * ```
   */
  public trimLinesTrailingSpaces() {
    return new Str(lib.trimLinesTrailingSpaces(this.text));
  }

  /**
   * Remove leading and trailing whitespace
   * @returns A new Str instance with whitespace removed from both ends
   * @example
   * ```typescript
   * str('  Hello  ').trim().$  // 'Hello'
   * ```
   */
  public trim() {
    return new Str(lib.trim(this.text));
  }

  /**
   * Remove leading whitespace
   * @returns A new Str instance with leading whitespace removed
   * @example
   * ```typescript
   * str('  Hello  ').trimStart().$  // 'Hello  '
   * ```
   */
  public trimStart() {
    return new Str(lib.trimStart(this.text));
  }

  /**
   * Remove trailing whitespace
   * @returns A new Str instance with trailing whitespace removed
   * @example
   * ```typescript
   * str('  Hello  ').trimEnd().$  // '  Hello'
   * ```
   */
  public trimEnd() {
    return new Str(lib.trimEnd(this.text));
  }

  /**
   * Split the string into an array of Str instances
   * @param separator - String or RegExp to split on
   * @param limit - Maximum number of splits to perform
   * @returns Array of Str instances
   * @example
   * ```typescript
   * str('a,b,c').split(',')  // [Str('a'), Str('b'), Str('c')]
   * str('a b c').split(' ', 2)  // [Str('a'), Str('b')]
   * ```
   */
  public split(separator: string | RegExp, limit?: number) {
    return lib.split(this.text, separator, limit).map((v) => new Str(v));
  }

  /**
   * Add line numbers to each line
   * @param separator - String to separate line numbers from content
   * @returns A new Str instance with line numbers added
   * @example
   * ```typescript
   * str('A\nB').addLineNumbers().$  // '0:A\n1:B'
   * str('A\nB').addLineNumbers(' -> ').$  // '0 -> A\n1 -> B'
   * ```
   */
  public addLineNumbers(separator: string = ":") {
    return new Str(lib.addLineNumbers(this.text, separator));
  }

  /**
   * Get the character at a specific index
   * @param index - Zero-based position in the string
   * @returns The character at the index, or undefined if out of bounds
   * @example
   * ```typescript
   * str('Hello').at(0)   // 'H'
   * str('Hello').at(-1)  // 'o'
   * ```
   */
  public at(index: number) {
    return this.text.at(index);
  }

  /**
   * Get the length of the string
   * @returns The number of characters in the string
   * @example
   * ```typescript
   * str('Hello').length()  // 5
   * str('').length()       // 0
   * ```
   */
  public length() {
    return this.text.length;
  }

  /**
   * Indent each line by a specified number of spaces
   * @param size - Number of spaces to add
   * @param char - Character to use for indentation
   * @returns A new Str instance with added indentation
   * @example
   * ```typescript
   * str('Hello\nWorld').indent(2).$  // '  Hello\n  World'
   * str('A\nB').indent(2, '-').$     // '--A\n--B'
   * ```
   */
  public indent(size: number, char: string = " ") {
    return new Str(lib.indent(this.text, size, char));
  }

  /**
   * Remove indentation from each line
   * @param indentation - Optional number of spaces to remove
   * @returns A new Str instance with indentation removed
   * @example
   * ```typescript
   * str('  Hello\n    World').dedent().$  // 'Hello\n  World'
   * str('    A\n  B').dedent(2).$         // '  A\nB'
   * ```
   */
  public dedent(indentation?: number) {
    return new Str(lib.dedent(this.text, indentation));
  }

  /**
   * Remove characters from the start of the string
   * @param count - Number of characters to remove
   * @returns A new Str instance with characters removed from the start
   * @example
   * ```typescript
   * str('Hello').chopStart(2).$  // 'llo'
   * ```
   */
  public chopStart(count: number) {
    return new Str(lib.chopStart(this.text, count));
  }

  /**
   * Remove characters from the end of the string
   * @param count - Number of characters to remove
   * @returns A new Str instance with characters removed from the end
   * @example
   * ```typescript
   * str('Hello').chopEnd(2).$  // 'Hel'
   * ```
   */
  public chopEnd(count: number) {
    if (count === 0) return this;
    return new Str(lib.chopEnd(this.text, count));
  }

  /**
   * Limit consecutive newlines to a maximum count
   * @param maxRepeat - Maximum number of consecutive newlines to allow
   * @returns A new Str instance with limited consecutive newlines
   * @example
   * ```typescript
   * str('A\n\n\nB').chopRepeatNewlines(1).$  // 'A\nB'
   * str('A\n\n\nB').chopRepeatNewlines(2).$  // 'A\n\nB'
   * ```
   */
  public chopRepeatNewlines(maxRepeat: number) {
    if (maxRepeat === 0) return this;
    return new Str(lib.chopRepeatNewlines(this.text, maxRepeat));
  }

  /**
   * Take characters from the start of the string
   * @param count - Number of characters to take
   * @returns A new Str instance with the first n characters
   * @example
   * ```typescript
   * str('Hello').takeStart(2).$  // 'He'
   * ```
   */
  public takeStart(count: number) {
    return new Str(lib.takeStart(this.text, count));
  }

  /**
   * Take characters from the end of the string
   * @param count - Number of characters to take
   * @returns A new Str instance with the last n characters
   * @example
   * ```typescript
   * str('Hello').takeEnd(2).$  // 'lo'
   * ```
   */
  public takeEnd(count: number) {
    return new Str(lib.takeEnd(this.text, count));
  }

  /**
   * Get the last line of the string
   * @returns A new Str instance containing the last line
   * @example
   * ```typescript
   * str('Hello\nWorld').lastLine().$  // 'World'
   * ```
   */
  public lastLine() {
    return new Str(lib.lastLine(this.text));
  }

  /**
   * Get the first line of the string
   * @returns A new Str instance containing the first line
   * @example
   * ```typescript
   * str('Hello\nWorld').firstLine().$  // 'Hello'
   * ```
   */
  public firstLine() {
    return new Str(lib.firstLine(this.text));
  }

  /**
   * Count leading space characters
   * @returns The number of leading space characters
   * @example
   * ```typescript
   * str('  Hello').leadingSpacesCount()  // 2
   * str('Hello').leadingSpacesCount()    // 0
   * ```
   */
  public leadingSpacesCount() {
    return lib.leadingSpacesCount(this.text);
  }

  /**
   * Get the minimum indentation level of non-empty lines
   * @returns The number of spaces in the minimum indentation
   * @example
   * ```typescript
   * str('  Hello\n    World').indentation()  // 2
   * str('Hello\n  World').indentation()      // 0
   * ```
   */
  public indentation() {
    return lib.indentation(this.text);
  }

  /**
   * Check if the string is empty or contains only whitespace
   * @returns True if empty or whitespace-only, false otherwise
   * @example
   * ```typescript
   * str('').isEmpty()      // true
   * str('  \n').isEmpty()  // true
   * str('Hello').isEmpty() // false
   * ```
   */
  public isEmpty() {
    return lib.isEmpty(this.text);
  }

  /**
   * Replace the first occurrence of a substring or pattern
   * @param searchValue - The string or pattern to search for
   * @param replaceValue - The string to replace the match with
   * @returns A new Str instance with the first match replaced
   * @example
   * ```typescript
   * str('Hello World').replace('o', '0').$     // 'Hell0 World'
   * str('abc abc').replace(/[a-z]/, 'X').$     // 'Xbc abc'
   * ```
   */
  public replace(searchValue: string | RegExp, replaceValue: string) {
    return new Str(lib.replace(this.text, searchValue, replaceValue));
  }

  /**
   * Replace all occurrences of a substring or pattern
   * @param searchValue - The string or pattern to search for
   * @param replaceValue - The string to replace the matches with
   * @returns A new Str instance with all matches replaced
   * @example
   * ```typescript
   * str('Hello World').replaceAll('o', '0').$     // 'Hell0 W0rld'
   * str('abc abc').replaceAll(/[a-z]/g, 'X').$    // 'XXX XXX'
   * ```
   */
  public replaceAll(searchValue: string | RegExp, replaceValue: string) {
    return new Str(lib.replaceAll(this.text, searchValue, replaceValue));
  }

  /**
   * Convert string to camelCase
   * @returns A new Str instance in camelCase
   * @example
   * ```typescript
   * str('hello-world').camelCase().$  // 'helloWorld'
   * ```
   */
  public camelCase() {
    return new Str(changeCase.camelCase(this.text));
  }

  /**
   * Convert string to Capital Case
   * @returns A new Str instance in Capital Case
   * @example
   * ```typescript
   * str('hello-world').capitalCase().$  // 'Hello World'
   * ```
   */
  public capitalCase() {
    return new Str(changeCase.capitalCase(this.text));
  }

  /**
   * Convert string to CONSTANT_CASE
   * @returns A new Str instance in CONSTANT_CASE
   * @example
   * ```typescript
   * str('hello-world').constantCase().$  // 'HELLO_WORLD'
   * ```
   */
  public constantCase() {
    return new Str(changeCase.constantCase(this.text));
  }

  /**
   * Convert string to dot.case
   * @returns A new Str instance in dot.case
   * @example
   * ```typescript
   * str('hello-world').dotCase().$  // 'hello.world'
   * ```
   */
  public dotCase() {
    return new Str(changeCase.dotCase(this.text));
  }

  /**
   * Convert string to kebab-case
   * @returns A new Str instance in kebab-case
   * @example
   * ```typescript
   * str('helloWorld').kebabCase().$  // 'hello-world'
   * ```
   */
  public kebabCase() {
    return new Str(changeCase.kebabCase(this.text));
  }

  /**
   * Convert string to no case
   * @returns A new Str instance with no case
   * @example
   * ```typescript
   * str('helloWorld').noCase().$  // 'hello world'
   * ```
   */
  public noCase() {
    return new Str(changeCase.noCase(this.text));
  }

  /**
   * Convert string to PascalCase
   * @returns A new Str instance in PascalCase
   * @example
   * ```typescript
   * str('hello-world').pascalCase().$  // 'HelloWorld'
   * ```
   */
  public pascalCase() {
    return new Str(changeCase.pascalCase(this.text));
  }

  /**
   * Convert string to Pascal_Snake_Case
   * @returns A new Str instance in Pascal_Snake_Case
   * @example
   * ```typescript
   * str('hello-world').pascalSnakeCase().$  // 'Hello_World'
   * ```
   */
  public pascalSnakeCase() {
    return new Str(changeCase.pascalSnakeCase(this.text));
  }

  /**
   * Convert string to path/case
   * @returns A new Str instance in path/case
   * @example
   * ```typescript
   * str('hello-world').pathCase().$  // 'hello/world'
   * ```
   */
  public pathCase() {
    return new Str(changeCase.pathCase(this.text));
  }

  /**
   * Convert string to Sentence case
   * @returns A new Str instance in Sentence case
   * @example
   * ```typescript
   * str('hello-world').sentenceCase().$  // 'Hello world'
   * ```
   */
  public sentenceCase() {
    return new Str(changeCase.sentenceCase(this.text));
  }

  /**
   * Convert string to snake_case
   * @returns A new Str instance in snake_case
   * @example
   * ```typescript
   * str('helloWorld').snakeCase().$  // 'hello_world'
   * ```
   */
  public snakeCase() {
    return new Str(changeCase.snakeCase(this.text));
  }

  /**
   * Convert string to Train-Case
   * @returns A new Str instance in Train-Case
   * @example
   * ```typescript
   * str('hello-world').trainCase().$  // 'Hello-World'
   * ```
   */
  public trainCase() {
    return new Str(changeCase.trainCase(this.text));
  }

  /**
   * Get the underlying string value
   * @returns The wrapped string value
   * @example
   * ```typescript
   * str('hello').str  // 'hello'
   * ```
   */
  public get str() {
    return this.toString();
  }
}

/**
 * Create a new Str instance from any stringable value
 * @param text - Any value that can be converted to a string
 * @returns A new Str instance wrapping the string value
 * @example
 * ```typescript
 * str('hello')          // from string
 * str(123)              // from number
 * str({ toString() })   // from object with toString
 * ```
 */
export const str = (text: Stringable) => {
  return new Str(text.toString());
};
