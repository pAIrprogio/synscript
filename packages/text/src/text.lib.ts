import { MaybeArray } from "@shared/src/ts.utils";
import { json } from "@synstack/json";
import { resolvable } from "@synstack/resolved";
import { callable, type CallableResolvable } from "@synstack/resolved/callable";
import { str } from "@synstack/str";

export class Text {
  private static EXTRA_OBJECT_PREFIX = "%STR_EXTRA%";
  private static EXTRA_OBJECT_SUFFIX = "%!STR_EXTRA%";

  private readonly _options: {
    joinString: string;
  };

  private constructor(options: Text.Options = {}) {
    this._options = {
      joinString: options.joinString ?? "\n",
    };
  }

  public static options(this: void, config: Text.Options = {}) {
    return new Text(config);
  }

  public options(config: Text.Options) {
    return new Text({ ...this._options, ...config });
  }

  public static t<T extends Array<Text.TemplateValue.Base>>(
    this: void,
    template: TemplateStringsArray,
    ...values: T
  ): Text.Return<T> {
    return Text.options().t(template, ...values);
  }

  public t<T extends Array<Text.TemplateValue.Base>>(
    template: TemplateStringsArray,
    ...values: T
  ): Text.Return<T> {
    // @ts-expect-error - Of course the default value is ""
    if (template.length === 0) return "";

    const resolvedValues = callable.resolveNested(values);
    return resolvable.pipe(resolvedValues)._((values) => {
      let text = template[0];

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        let wrappedValue = "";

        if (Array.isArray(value)) {
          wrappedValue = value
            .filter((inner) => inner !== null || inner !== undefined)
            .map(Text.wrapValue)
            .join(this._options.joinString);
        } else {
          wrappedValue = Text.wrapValue(value);
        }
        const nextString = template[i + 1];
        const lastLine = str(text).lastLine();
        const indentation = lastLine.isEmpty()
          ? lastLine.leadingSpacesCount()
          : 0;
        text =
          str(text).chopEnd(indentation).toString() +
          str(wrappedValue).indent(indentation).toString() +
          nextString;
      }

      return str(text)
        .chopEmptyLinesStart()
        .trimEnd()
        .dedent()
        .trimEmptyLines()
        .chopRepeatNewlines(2)
        .toString() as string & {
        __extra: Text.ExtraObject.Infer<T>;
      };
    }).$ as Text.Return<T>;
  }

  private static wrapValue(this: void, value: Text.Value.Base) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      if (!Object.hasOwn(value, "type")) {
        throw new Error(
          'Text templating only supports objects with a "type" property',
        );
      }
      return `${Text.EXTRA_OBJECT_PREFIX}${JSON.stringify(value)}${
        Text.EXTRA_OBJECT_SUFFIX
      }`;
    }
    return value;
  }

  public static parse<E extends Text.ExtraObject.Base>(
    this: void,
    text: Text.String<E>,
  ): Array<string | E> {
    const regex = new RegExp(
      Text.EXTRA_OBJECT_PREFIX + "(.*?)" + Text.EXTRA_OBJECT_SUFFIX,
      "g",
    );
    const parts: Array<string | E> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Parse and add the JSON object
      try {
        const jsonObject = json.deserialize<E>(match[1]);
        parts.push(jsonObject);
      } catch (error) {
        throw new TextParseExtraItemException(match[1], error);
      }

      lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }
}

export declare namespace Text {
  export type Options = {
    joinString?: string;
  };

  export type OptionalString = string | undefined | null;

  export type String<TExtraObject extends Text.ExtraObject.Base = never> =
    string & {
      __extra: TExtraObject;
    };

  export namespace ExtraObject {
    export type Base = { type: string };

    type InferExtraObjectValue<T> = T extends Text.OptionalString ? never : T;
    type InferExtraObjectCallableResolvable<T> = InferExtraObjectValue<
      CallableResolvable.Infer<T>
    >;
    type InferExtraArrayable<T> =
      T extends Array<any>
        ? { [K in keyof T]: InferExtraObjectCallableResolvable<T[K]> }[number]
        : InferExtraObjectCallableResolvable<T>;

    export type Infer<T extends any[]> = {
      // Check if it's an array
      [K in keyof T]: InferExtraArrayable<T[K]>;
    }[number];
  }

  export type Value<TExtraObject extends Text.ExtraObject.Base = never> =
    | Text.OptionalString
    | TExtraObject;

  export namespace Value {
    export type Base = OptionalString | ExtraObject.Base;
  }

  export type TemplateValue<
    TExtraObject extends Text.ExtraObject.Base = never,
  > = CallableResolvable.MaybeArray<Value<TExtraObject>>;

  export namespace TemplateValue {
    export type Base = TemplateValue<ExtraObject.Base>;

    export type Resolved<TExtraObject extends Text.ExtraObject.Base = never> =
      MaybeArray<Value<TExtraObject>>;
    export namespace Resolved {
      export type Base = Resolved<ExtraObject.Base>;
    }
  }

  export type Return<T extends Array<Text.TemplateValue.Base>> =
    true extends CallableResolvable.MaybeArray.ArrayOf.IsPromise<T>
      ? Promise<string & { __extra: ExtraObject.Infer<T> }>
      : string & { __extra: ExtraObject.Infer<T> };
}

export class TextParseExtraItemException extends Error {
  constructor(itemString: string, cause: any) {
    super(
      `
Failed to parse extra item serialized value

Value:
${str(itemString).indent(2).toString()}

Cause:
${str(cause instanceof Error ? cause.message : (cause as string))
  .indent(2)
  .toString()}

`.trimStart(),
      { cause },
    );
  }
}

export const t = Text.t;
export const tParse = Text.parse;
