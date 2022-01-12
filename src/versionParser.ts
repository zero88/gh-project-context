import { replaceInFile } from 'replace-in-file';
import { isEmpty } from './utils';
import { mergeVersionResult, VersionPattern, VersionResult } from './versionStrategy';

const extract = (match: string, regex: RegExp): RegExpMatchArray | null => match.match(regex);

const replaceMatch = (expected: string, actual: string, pattern: RegExp, group: number): any => {
  const matcher = extract(actual, pattern);
  const skipFirst = matcher?.[0] === actual;
  if (group === 0 && skipFirst) {
    return expected;
  }
  const g = skipFirst ? group + 1 : group;
  return matcher
    ? matcher.reduce((p, c, i) => skipFirst && i === 0 ? '' : p.concat(i === g ? expected : c), '')
    : actual;
};

const searchMatch = (actual: string, pattern: RegExp, group: number): string => {
  const matcher = extract(actual, pattern);
  const skipFirst = matcher?.[0] === actual;
  if (group === 0 && skipFirst) {
    return actual;
  }
  return <string>matcher?.[skipFirst ? group + 1 : group];
};

const replace = (pattern: VersionPattern, version: string, dryRun: boolean): Promise<VersionResult> =>
  replaceInFile({
    files: pattern.files, from: pattern.pattern, dry: dryRun,
    to: (match, _) => replaceMatch(version, match, pattern.pattern, pattern.group),
  }).then(rr => {
    const files = rr.filter(r => r.hasChanged).map(r => r.file);
    return { files, isChanged: !isEmpty(files), version };
  });

const search = (pattern: VersionPattern): Promise<string> => {
  const versions = new Array<string>();
  const config = {
    files: pattern.files, from: pattern.pattern, dry: true,
    to: (match, _) => {
      versions.push(searchMatch(match, pattern.pattern, pattern.group));
      return match;
    },
  };
  return replaceInFile(config).then(_ => versions.find(v => v) ?? '');
};

export const VersionParser = {
  replace: (versionPatterns: VersionPattern[], version: string, dryRun: boolean): Promise<VersionResult> =>
    Promise.all(versionPatterns.map(pattern => replace(pattern, version, dryRun)))
      .then(result => result.reduce((p, n) => mergeVersionResult(p, n))),
  search: (versionPatterns: VersionPattern[], fallbackVersion: string): Promise<VersionResult> =>
    Promise.all(versionPatterns.map(search))
      .then(versions => versions.find(v => v))
      .then(v => ({ files: [], isChanged: false, version: v ?? fallbackVersion })),

};
