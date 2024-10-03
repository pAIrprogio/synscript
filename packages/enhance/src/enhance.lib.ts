export const ENHANCER_NAME = Symbol("EnhancerName");

// The order of the types is important as it affects overriding
export type Enhanced<
  TName extends string,
  TBaseObject extends object,
  TExtension extends object,
> = { $: TBaseObject; [ENHANCER_NAME]: TName } & TExtension & TBaseObject;

export const enhance = <
  TName extends string,
  TBaseObject extends object | (object & { [ENHANCER_NAME]: TName; $: object }),
  TExtension extends object,
>(
  name: TName,
  obj: TBaseObject,
  extendObj: TExtension,
) => {
  // If the object is already enhanced, we use the original object
  const _obj =
    ENHANCER_NAME in obj && obj[ENHANCER_NAME] === name ? obj.$ : obj;
  return new Proxy(_obj, {
    get(target: TBaseObject, prop: string | number | symbol, receiver: any) {
      // We add a $ property to the base object to allow access to the original object
      if (prop === "$" || prop === "valueOf" || prop === Symbol.toPrimitive)
        return () => _obj;
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      if (prop === "toString") return () => obj.toString();
      if (prop === ENHANCER_NAME) return name;
      if (prop in extendObj)
        // @ts-expect-error - We know that the property exists
        return extendObj[prop].bind(target);

      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as Enhanced<TName, TBaseObject, TExtension>;
};

export const enhanceFactory =
  <TName extends string, TExtension extends object>(
    name: TName,
    extendObj: TExtension,
  ) =>
  <
    TBaseObject extends
      | object
      | (object & { [ENHANCER_NAME]: TName; $: object }),
  >(
    obj: TBaseObject,
  ) =>
    enhance(name, obj, extendObj);
