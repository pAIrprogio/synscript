export function deepEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true;
  }

  if (isPrimitive(obj1) && isPrimitive(obj2)) {
    return obj1 === obj2;
  }

  if (obj1 == null || obj2 == null) {
    return false;
  }

  const keys1 = Object.keys(obj1 as {}).filter((k) => obj1[k] !== undefined);
  const keys2 = Object.keys(obj2 as {}).filter((k) => obj2[k] !== undefined);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

//check if value is primitive
function isPrimitive(obj: any) {
  return obj !== Object(obj);
}
