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
