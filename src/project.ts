import * as core from '@actions/core';
import { lstatSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { replaceInFile, ReplaceResult } from 'replace-in-file';
import { inc, valid } from 'semver';
import { GitContextInput, GitInteractor, GitInteractorInput } from './git';
import { Decision, GitContextOutput, Versions } from './output';

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

  static readonly DEFAULT_PATTERNS = `pyproject.toml::(version\\s?=\\s?)(")([^"]+)(")::2
  package?(-lock).json::("version"\\s?:\\s?)(")([^"]+)(")::2
  @(gradle|maven|pom|project).properties::(version\\s?=\\s?)(.+)::1
  @(application|version).yml::(version:\\s)(.+)::1
  @(VERSION|version)?(.txt)::.+::0
  `;
  readonly gInput: GitContextInput;
  readonly iInput: GitInteractorInput;
  readonly pInputs: ProjectContextInput[];

  private constructor(ghInput: GitContextInput, interactorInput: GitInteractorInput, inputs: ProjectContextInput[]) {
    this.gInput = ghInput;
    this.iInput = interactorInput;
    this.pInputs = inputs;
  }

  /**
   * Project patterns to search/replace version. Format: <glob_pattern_with_ext>::<version_regex>::<regex_group>
   * @param ghInput
   * @param interactorInput
   * @param {string} patterns
   * @see DEFAULT_PATTERNS
   * @return {ProjectContextOps}
   */
  static create(ghInput: GitContextInput, interactorInput: GitInteractorInput, patterns: string): ProjectContextOps {
    return new ProjectContextOps(ghInput, interactorInput, ProjectContextOps.parse(patterns));
  }

  static parse(patterns: string): ProjectContextInput[] {
    patterns = patterns ?? this.DEFAULT_PATTERNS;
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
    const ext = path.extname(files?.[0]) || '.txt';
    const pattern = arr?.[1];
    const group = parseInt(arr?.[2]);
    const regex = FileVersionParser.findRegex(ext, pattern, isNaN(group) ? 0 : group);
    return { files, ext, pattern: regex[0], group: regex[1] };
  }

  private static paths(pattern: string): string[] {
    return glob.sync(pattern).filter(path => lstatSync(path).isFile());
  }

  fixOrSearchVersion(ghOutput: GitContextOutput, dryRun: boolean = true): Promise<FileVersionResult> {
    const version = ghOutput.version;
    if (!version || version.trim().length === 0) {
      core.info(`Searching version in file...`);
      return Promise.all(this.pInputs.map(input => FileVersionParser.search(input)))
                    .then(versions => versions.find(v => v))
                    .then(v => v || ghOutput.branch)
                    .then(v => {
                      core.info(`Version: ${v}`);
                      return { isChanged: false, version: v };
                    });
    }
    core.info(`Fixing version to ${version}...`);
    return Promise.all(this.pInputs.map(input => FileVersionParser.replace(input, dryRun, version)))
                  .then(result => result.reduce((p, c) => p.concat(c), [])
                                        .filter(r => r.hasChanged))
                  .then(r => {
                    const files = r.map(v => v.file);
                    core.info(`Fixed ${r.length} file(s): [${files}]`);
                    return { isChanged: r.length > 0, files };
                  });
  };

  ciStep(versionResult: FileVersionResult, ghOutput: GitContextOutput, dryRun: boolean): Promise<GitContextOutput> {
    const mustFixVersion = versionResult.isChanged;
    const ver = { current: <string>versionResult.version };
    if (ghOutput.isTag && mustFixVersion) {
      throw `Git tag version doesn't meet with current version in files. Invalid files: [${versionResult.files}]`;
    }
    const interactor = new GitInteractor(this.iInput, this.gInput);
    if (mustFixVersion) {
      return interactor.commitPushIfNeed(ghOutput.branch, ghOutput.version, mustFixVersion, dryRun)
                       .then(ci => ({ ...ghOutput, ci, ver }));
    }
    if (ghOutput.isReleasePR && ghOutput.isMerged) {
      core.info(`Tag new version ${ghOutput.version}...`);
      return interactor.tagThenPush(ghOutput.version, ghOutput.isMerged, dryRun)
                       .then(ci => ({ ...ghOutput, ci }));
    }
    return Promise.resolve({ ...ghOutput, ver });
  }

  makeDecision(output: GitContextOutput): Decision {
    const build = !output.isClosed && !output.isMerged && !output.ci?.isPushed && !output.isAfterMergedReleasePR;
    const publish = build && (output.onDefaultBranch || output.isTag);
    return { build, publish };
  }

  nextVersion(output: GitContextOutput): Versions {
    const v = valid(output.version) ?? valid(output.ver?.current);
    if (!output.isAfterMergedReleasePR || !v) {
      return <Versions>output.ver;
    }
    return { current: v, nextMajor: inc(v, 'major'), nextMinor: inc(v, 'minor'), nextPath: inc(v, 'patch') };
  }
}

export interface FileVersionResult {
  readonly isChanged: boolean;
  readonly files?: string[];
  readonly version?: string;
}

export class FileVersionParser {

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

  static replaceMatch(expected: string, actual: string, pattern: RegExp, group: number): any {
    const matcher = FileVersionParser.extract(actual, pattern);
    const shouldSkipFirst = matcher?.[0] === actual;
    if (group === 0 && shouldSkipFirst) {
      return expected;
    }
    const g = shouldSkipFirst ? group + 1 : group;
    return matcher ? matcher.reduce((p, c, i) => shouldSkipFirst && i == 0 ? '' : p.concat(i === g ? expected : c), '')
                   : actual;
  }

  static searchMatch(actual: string, pattern: RegExp, group: number): string {
    const matcher = FileVersionParser.extract(actual, pattern);
    const shouldSkipFirst = matcher?.[0] === actual;
    if (group === 0 && shouldSkipFirst) {
      return actual;
    }
    return <string>matcher?.[shouldSkipFirst ? group + 1 : group];
  }

  static replace(input: ProjectContextInput, dryRun: boolean, version: string): Promise<ReplaceResult[]> {
    return replaceInFile(
      {
        files: input.files, from: input.pattern, dry: dryRun,
        to: (match, _) => FileVersionParser.replaceMatch(version, match, input.pattern, input.group),
      });
  }

  static search(input: ProjectContextInput): Promise<string> {
    const versions = new Array<string>();
    const config = {
      files: input.files, from: input.pattern, dry: true,
      to: (match, _) => {
        versions.push(FileVersionParser.searchMatch(match, input.pattern, input.group));
        return match;
      },
    };
    return replaceInFile(config).then(_ => versions.find(v => v) ?? '');
  }
}
