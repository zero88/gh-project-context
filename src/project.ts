import * as core from '@actions/core';
import { lstatSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { replaceInFile } from 'replace-in-file';

export interface ProjectContextInput {
  /**
   * List of files
   * @type {string}
   */
  readonly files: string[];
  /**
   * File ext
   * @type {string}
   */
  readonly ext: string;
  /**
   * Version pattern to find and replace
   * @type {string}
   */
  readonly pattern: RegExp;

  readonly group: number;
}

export class ProjectContextOps {

  readonly inputs: ProjectContextInput[];

  private constructor(inputs: ProjectContextInput[]) {
    this.inputs = inputs;
  }

  static create(patterns: string): ProjectContextOps {
    return new ProjectContextOps(ProjectContextOps.parse(patterns));
  }

  static parse(patterns: string): ProjectContextInput[] {
    return patterns.split(/\r?\n/)
                   .reduce<string[]>((acc, line) => acc.concat(line.split(','))
                                                       .filter(pat => pat).map(pat => pat.trim()), [])
                   .map(item => item.split('::'))
                   .map(arr => ProjectContextOps.parseInput(arr))
                   .filter(input => input);
  }

  private static parseInput(arr: string[]): ProjectContextInput {
    const files = ProjectContextOps.paths(arr?.[0]);
    if (files.length === 0) {
      return <ProjectContextInput><unknown>null;
    }
    const ext = path.extname(files?.[0]) ?? '.txt';
    const group = parseInt(arr?.[1]);
    const pattern = arr?.[2];
    const regex = VersionParser.findRegex(ext, pattern, isNaN(group) ? 0 : group);
    return { files, ext, pattern: regex[0], group: regex[1] };
  }

  private static paths(pattern: string): string[] {
    return glob.sync(pattern).filter(path => lstatSync(path).isFile());
  }

  validateThenReplace(version: string, dryRun: boolean = true): Promise<boolean> {
    return Promise.all(this.inputs.map(input => this.replace(input, dryRun, version)))
                  .then(result => result.reduce((p, c) => p.concat(c))
                                        .filter(r => r.hasChanged))
                  .then(r => {
                    core.debug(`Has some files updated: ${JSON.stringify(r, null, 2)}`);
                    return r.length > 0;
                  });
  };

  private replace(input: ProjectContextInput, dryRun: boolean, version: string) {
    return replaceInFile({
                           files: input.files, dry: dryRun, from: input.pattern,
                           to: (match, _) => VersionParser.replace(version, match, input.pattern, input.group),
                         });
  }
}

export class VersionParser {

  static findRegex(ext: string, versionPattern: string, group: number): [RegExp, number] {
    if (versionPattern && versionPattern.trim().length === 0) {
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
  }

  static extract(match: string, regex: RegExp): RegExpMatchArray | null {
    return match.match(regex);
  }

  static replace(expected: string, actual: string, pattern: RegExp, group: number) {
    const matcher = VersionParser.extract(actual, pattern);
    const shouldSkipFirst = matcher?.[0] === actual;
    if (group === 0 && shouldSkipFirst) {
      return expected;
    }
    const g = shouldSkipFirst ? group + 1 : group;
    return matcher ? matcher.reduce((p, c, i) => shouldSkipFirst && i == 0 ? '' : p.concat(i === g ? expected : c), '')
                   : actual;
  }
}

