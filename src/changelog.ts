import * as core from '@actions/core';
import path from 'path';
import { replaceInFile } from 'replace-in-file';
import { DockerRunCLI } from './docker';
import { RUNNER_ENV } from './githubRunner';
import { CommitStatus } from './gitOps';
import { isEmpty, isNotEmpty, RegexUtils, removeEmptyProperties } from './utils';

export interface ChangelogConfig {
  /**
   * Check whether changelog generator is active or not
   * <p>
   * Default value is `false`
   * @type {boolean}
   */
  readonly active: boolean;
  /**
   * Returns changelog-generator docker image
   * {@link https://hub.docker.com/r/githubchangeloggenerator/github-changelog-generator/}
   */
  readonly image: string;
  /**
   * Returns changelog-generator config file
   * {@link https://github.com/github-changelog-generator/github-changelog-generator#params-file}
   */
  readonly configFile: string;
  /**
   * Returns changelog-generator commit message
   */
  readonly commitMsg: string;
  /**
   * Returns changelog-generator token to query GitHub API
   * {@link https://github.com/github-changelog-generator/github-changelog-generator#github-token}
   */
  readonly token?: string;
}

export interface GeneratedResult {
  readonly generated: boolean;
  readonly sinceTag: string;
  readonly releaseTag: string;
  readonly commitMsg?: string;
}

export type ChangelogResult = GeneratedResult & CommitStatus

const defaultConfig: ChangelogConfig = {
  active: false,
  image: `githubchangeloggenerator/github-changelog-generator:1.16.2`,
  configFile: '.github_changelog_generator',
  commitMsg: 'Generated CHANGELOG',
};

export const createChangelogConfig = (active?: boolean, image?: string, configFile?: string, token?: string,
  commitMsg?: string): ChangelogConfig => ({
  ...defaultConfig, ...removeEmptyProperties({ active, configFile, token, commitMsg, image }),
});

export class ChangelogOps {
  private readonly config: ChangelogConfig;

  constructor(config: ChangelogConfig) {
    this.config = config;
  }

  async generate(sinceTag: string, releaseTag: string, releaseBranch: string | undefined,
    dryRun: boolean): Promise<GeneratedResult> {
    if (!this.config.active) {
      return { sinceTag, releaseTag, generated: false };
    }
    return core.group(`[CHANGELOG] Generating CHANGELOG ${releaseTag} since ${sinceTag}...`, async () => {
      const { workspace, apiUrl, webUrl, owner, repo } = RUNNER_ENV;
      const isExisted = await this.verifyExists(workspace, releaseTag);
      if (isExisted) {
        core.info(`[CHANGELOG] ${releaseTag} changelog is existed. Skip to generate CHANGELOG.`);
        return { sinceTag, releaseTag, generated: false };
      }
      const commitMsg = `${this.config.commitMsg} ${releaseTag}`;
      const cmd = [
        `--user`, owner,
        `--project`, repo,
        `--config-file`, this.config.configFile,
        `--since-tag`, sinceTag,
        `--future-release`, releaseTag,
        `--github-api`, apiUrl,
        `--github-site`, webUrl,
      ];
      if (isNotEmpty(releaseBranch)) cmd.push(`--release-branch`, releaseBranch!);
      const envs = { 'CHANGELOG_GITHUB_TOKEN': this.config.token };
      const volumes = { [workspace]: DockerRunCLI.DEFAULT_WORKDIR };
      const dockerRun = await DockerRunCLI.execute(this.config.image, cmd, envs, volumes);
      return { sinceTag, releaseTag, commitMsg, generated: dockerRun.success };
    });
  }

  private async verifyExists(workspace: string, releaseTag: string): Promise<boolean> {
    const re = /((base|output)\s?=\s?)(.+)/;
    const result: string[] = [];
    await replaceInFile({
      files: this.config.configFile, from: new RegExp(re.source, 'gm'), dry: true, allowEmptyPaths: true,
      to: match => {
        result.push(RegexUtils.searchMatch(match, re, 2));
        return match;
      },
    });
    const files = (isEmpty(result) ? ['CHANGELOG.md'] : result).map(f => path.resolve(workspace, f));
    return await replaceInFile(
      { files, from: releaseTag, dry: true, countMatches: true, allowEmptyPaths: true, to: match => match })
      .then(rr => rr.some(r => r?.numMatches! > 0));
  }
}
