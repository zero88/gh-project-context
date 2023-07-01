export const flatten = (obj: object, sep = '_', prefix = '', res = {}): object => {
  return Object.entries(obj).reduce((r, [key, val]) => {
    const k = `${prefix}${key}`;
    if (val !== null && typeof val === 'object') {
      flatten(val, sep, `${k}${sep}`, r);
    } else {
      res[k] = val;
    }
    return r;
  }, res);
};

export const isNull = (value: any): boolean => value == null; // undefined or null

export const isNotNull = (value: any): boolean => !isNull(value);

export const isObject = (value: any): boolean => isNotNull(value) && typeof value === 'object';

export const isFunction = (func: any): boolean => func && {}.toString.call(func) === '[object Function]';

export const isArray = (value: any): boolean => isNotNull(value) && Array.isArray(value);

export const isMap = (value: any): boolean => value instanceof Map;

export const isSet = (value: any): boolean => value instanceof Set;

export const isJSON = (value: any): boolean => isObject(value) || isArray(value);

export const isString = (value: any): boolean => typeof value === 'string' || value instanceof String;

export const isNumeric = (n): boolean => !Number.isNaN(parseFloat(n)) && Number.isFinite(parseFloat(n));

export const isGreaterThanZero = (v: any): boolean => isNumeric(v) && +v > 0;

export const isFalsy = (v: any): boolean =>
  isNull(v) || v === false || v === '' || Number.isNaN(v) || [0, -0].includes(v);

export const isTruthy = (v: any): boolean => !isFalsy(v);

export const isEmpty = (value: any): boolean => {
  if (isNull(value)) {
    return true;
  }
  if (isMap(value) || isSet(value)) {
    return value.size === 0;
  }
  if (isArray(value)) {
    return value.length === 0;
  }
  if (isJSON(value)) {
    return Object.keys(value).length === 0;
  }
  if (isString(value)) {
    return value.trim() === '';
  }
  return value.toString().trim() === '';
};

export const isNotEmpty = (value: any): boolean => !isEmpty(value);

export const emptyOrElse = <T>(value: T, fallback: T): T => isEmpty(value) ? fallback : value;

export const prettier = (value: any, sort: 'asc' | 'desc' | 'nope' = 'asc', indent = 2): string =>
  JSON.stringify(value,
    sort === 'nope' ? undefined : (sort === 'desc' ? Object.keys(value).reverse() : Object.keys(value).sort()),
    indent);

export const convertToNumber = (value: any, strict: boolean = false): number | null => {
  if (isNull(value)) {
    return null;
  }
  const inString = value.toString();
  const n = +inString;
  if (isNumeric(n) && !/^\s*$/.test(inString)) {
    return n;
  }
  if (strict) {
    throw new Error('Invalid number');
  }
  return null;
};

const convertArrToObj = <T, V>(
  arr: Array<T>,
  keyMapper: (o: T, idx?: number) => any = (k) => k,
  valMapper: (o: T, idx?: number) => T | V = (k) => k,
): { [k: string]: T | V } =>
  arr.reduce((obj, o, idx) => {
    obj[`${keyMapper(o, idx)}`] = valMapper(o, idx);
    return obj;
  }, {});

export const arrayToObject = <T>(arr: Array<T>): Record<string, T> => convertArrToObj(arr);

export const arrayToObjectWithKey = <T>(arr: Array<T>, keyMapper: (o: T, idx?: number) => any): { [k: string]: T } =>
  convertArrToObj(arr, keyMapper, (o) => o);

export const arrayToObjectWithVal = <T>(arr: Array<T>, valMapper: (o: T, idx?: number) => any): { [k: string]: T } =>
  convertArrToObj(arr, (k) => k, valMapper);

export const removeEmptyProperties = (obj: any): any => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => !isEmpty(v)));

export class RegexUtils {
  private static extract = (match: string, regex: RegExp): RegExpMatchArray | null => match.match(regex);

  static replaceMatch = (expected: string, actual: string, pattern: RegExp, group: number): any => {
    const matcher = RegexUtils.extract(actual, pattern);
    const skipFirst = matcher?.[0] === actual;
    if (group === 0 && skipFirst) {
      return expected;
    }
    const g = skipFirst ? group + 1 : group;
    return matcher
      ? matcher.reduce((p, c, i) => skipFirst && i === 0 ? '' : p.concat(i === g ? expected : c), '')
      : actual;
  };

  static searchMatch = (actual: string, pattern: RegExp, group: number): string => {
    const matcher = RegexUtils.extract(actual, pattern);
    const skipFirst = matcher?.[0] === actual;
    if (group === 0 && skipFirst) {
      return actual;
    }
    return <string>matcher?.[skipFirst ? group + 1 : group];
  };
}
