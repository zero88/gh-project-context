import { lstatSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { inc, parse, valid } from 'semver';
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

export interface NextVersion {
  /**
   * Suggest next major version if after release
   */
  readonly nextMajor?: string;
  /**
   * Suggest next minor version if after release
   */
  readonly nextMinor?: string;
  /**
   * Suggest next path version if after release
   */
  readonly nextPath?: string;
  /**
   * Bumped version
   */
  readonly bumpedVersion?: string;
}

export const mergeVersionResult = (prev: VersionResult, next: VersionResult): VersionResult => ({
  isChanged: next.isChanged || prev.isChanged,
  files: [...prev.files ?? [], ...next.files ?? []],
  version: next.version ?? prev.version,
});

export const DEFAULT_PATTERNS = `pyproject.toml::(version\\s?=\\s?)(")([^"]+)(")::2
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

const getBumpedVersion = (versions: NextVersion, nextMode: NextVersionMode) => {
  if (nextMode === 'MAJOR') return versions.nextMajor!;
  if (nextMode === 'MINOR') return versions.nextMinor!;
  if (nextMode === 'PATCH') return versions.nextPath!;
  return undefined;
};

export const createVersionStrategy = (filePatterns?: string, nextMode?: string | NextVersionMode): VersionStrategy => ({
  nextVersionMode: ['MAJOR', 'MINOR', 'PATCH', 'NONE'].includes(nextMode ?? '') ? <NextVersionMode>nextMode : 'NONE',
  versionPatterns: parseVersionsPatterns(filePatterns),
});

export const createNextVersion = (current: string, nextMode: NextVersionMode): NextVersion => {
  if (!valid(current)) {
    return {};
  }
  const nextVersion = {
    nextMajor: inc(current, 'major')!,
    nextMinor: inc(current, 'minor')!,
    nextPath: inc(current, 'patch')!,
  };
  return { ...nextVersion, bumpedVersion: getBumpedVersion(nextVersion, nextMode) };
};

export const findPreviousVersion = (current: string, versions: string[]): string => {
  if (isEmpty(versions)) throw `Required a list of versions`;
  const semVer = parse(current);
  if (!semVer) throw `Invalid version ${current}`;
  const prev = versions.find(v => semVer.compare(v) > 0 || (semVer.compare(v) === 0 && semVer.compareBuild(v) > 0));
  if (!prev) throw `Not found previous version`;
  return prev;
};
