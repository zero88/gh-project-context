const flatten = (obj: object, sep = '.', prefix = '', res = {}): object => {
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
