import { lstatSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { inc, valid } from 'semver';
import { Versions } from './projectContext';
import { RuntimeVersions } from './runtimeContext';
import { convertToNumber, isEmpty } from './utils';

export type NextVersionMode = 'MAJOR' | 'MINOR' | 'PATCH' | 'NONE';

export interface VersionPattern {
  /**
   * List of files
   * @type {string}
   */
  readonly files: string[];
  /**
   * The file ext
   * @type {string}
   */
  readonly ext: string;
  /**
   * The version pattern to find and replace
   * @type {string}
   */
  readonly pattern: RegExp;
  /**
   * The version group
   */
  readonly group: number;

}

export interface VersionExternalCLI {
  readonly externalCLI: string[];
  readonly searchCommand: string;
  readonly fixCommand: string;
}

export type VersionStrategy = {
  /**
   * Next version mode
   * @type {NextVersionMode}
   */
  readonly nextVersionMode: NextVersionMode;

  /**
   * Version patterns
   * @type {NextVersionMode}
   */
  readonly versionPatterns: VersionPattern[];
}

export interface VersionResult {
  readonly isChanged: boolean;
  readonly files: string[];
  readonly version: string;
}

export const mergeVersionResult = (prev: VersionResult, next: VersionResult): VersionResult => ({
  isChanged: next.isChanged || prev.isChanged,
  files: [...prev.files ?? [], ...next.files ?? []],
  version: next.version ?? prev.version,
});

const DEFAULT_PATTERNS = `pyproject.toml::(version\\s?=\\s?)(")([^"]+)(")::2
  package?(-lock).json::("version"\\s?:\\s?)(")([^"]+)(")::2
  @(gradle|maven|pom|project).properties::(version\\s?=\\s?)(.+)::1
  @(application|version).yml::(version:\\s)(.+)::1
  @(VERSION|version)?(.txt)::.+::0
  `;

const findRegex = (ext: string, versionPattern: string, group: number): [RegExp, number] => {
  if (!isEmpty(versionPattern)) {
    return [new RegExp(versionPattern), group];
  }
  if (ext === '.json') {
    return [new RegExp(/("version"\s?:\s?)(")([^"]+)(")/), 2];
  }
  if (ext === '.properties') {
    return [new RegExp(/(version\s?=\s?)(.+)/), 1];
  }
  if (ext === '.toml') {
    return [new RegExp(/(version\s?=\s?)(")([^"]+)(")/), 2];
  }
  if (ext === '.yaml' || ext === '.yml') {
    return [new RegExp(/(version:\s)(.+)/), 1];
  }
  return [new RegExp(/.+/), 0];
};

const parseVersionPattern = (arr: string[]): VersionPattern => {
  const files = isEmpty(arr[0]) ? [] : glob.sync(arr[0]).filter(path => lstatSync(path).isFile());
  if (isEmpty(files)) {
    return <VersionPattern><unknown>null;
  }
  const ext = path.extname(files?.[0]) || '.txt';
  const pattern = arr?.[1];
  const group = convertToNumber(arr?.[2]);
  const regex = findRegex(ext, pattern, group ?? 0);
  return { files, ext, pattern: regex[0], group: regex[1] };
};

const parseVersionsPatterns = (patterns?: string): VersionPattern[] =>
  (patterns ?? DEFAULT_PATTERNS).split(/\r?\n/)
    .reduce<string[]>((acc, line) => acc.concat(line.split(',')).filter(pat => pat).map(pat => pat.trim()), [])
    .map(item => item.split('::'))
    .map(arr => parseVersionPattern(arr))
    .filter(ctx => ctx);

export const createVersionStrategy = (filePatterns?: string, nextMode?: string | NextVersionMode): VersionStrategy => ({
  nextVersionMode: ['MAJOR', 'MINOR', 'PATCH', 'NONE'].includes(nextMode ?? '') ? <NextVersionMode>nextMode : 'NONE',
  versionPatterns: parseVersionsPatterns(filePatterns),
});

export const createVersions = (runtime: RuntimeVersions, current: string, isGenNext: boolean = false): Versions => {
  if (isGenNext && valid(current)) {
    return {
      ...runtime, current,
      nextMajor: inc(current, 'major')!,
      nextMinor: inc(current, 'minor')!,
      nextPath: inc(current, 'patch')!,
    };
  }
  return { ...runtime, current };
};

export const getNextVersion = (versions: Versions, nextMode: NextVersionMode) => {
  if (nextMode === 'MAJOR') {
    return versions.nextMajor!;
  }
  if (nextMode === 'MINOR') {
    return versions.nextMinor!;
  }
  if (nextMode === 'PATCH') {
    return versions.nextPath!;
  }
  return null;
};
