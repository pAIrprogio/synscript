/**
 * Helper function to check if a value has Object.prototype
 */
function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === "[object Object]";
}

/**
 * Checks if a value is a plain object (not an array, null, or other special objects)
 * Copied from: https://github.com/jonschlinkert/is-plain-object
 * Used by TanStack Query to determine which objects should have their keys sorted
 */
function isPlainObject(o: any): o is Record<string, any> {
  if (!hasObjectPrototype(o)) {
    return false;
  }

  // If has modified constructor
  const ctor = o.constructor;
  if (typeof ctor === "undefined") {
    return true;
  }

  // If has modified prototype
  const prot = ctor.prototype;
  if (!hasObjectPrototype(prot)) {
    return false;
  }

  // If constructor does not have an Object-specific method
  if (!prot.hasOwnProperty("isPrototypeOf")) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

/**
 * Returns a stable shape of an object with all its properties sorted alphabetically
 */
function stableObjectShape(value: any): any {
  return isPlainObject(value)
    ? Object.keys(value)
        .sort()
        .reduce((result, key) => {
          result[key] = stableObjectShape(value[key]);
          return result;
        }, {} as any)
    : value;
}

/**
 * Returns a stable string of an object with all its properties sorted alphabetically
 */
export function stableKey(value: any): string {
  return JSON.stringify(value, (_, val) => stableObjectShape(val));
}
