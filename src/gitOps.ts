import * as core from '@actions/core';
import { exec, strictExec } from './exec';
import { CIContext } from './projectContext';

/**
 * Represents for Git CI input
 */
export type GitOpsConfig = {

  /**
   * CI: Allow git commit to fix version if not match
   * @type {boolean}
   */
  readonly allowCommit: boolean;
  /**
   * CI: Allow git tag if merged release branch
   * @type {boolean}
   */
  readonly allowTag: boolean;
  /**
   * CI: Required GPG sign
   * @type {string}
   */
  readonly mustSign: boolean;
  /**
   * CI: Prefix bot message
   * @type {string}
   */
  readonly prefixCiMsg: string;
  /**
   * CI: Correct version message template
   * @type {string}
   */
  readonly correctVerMsg: string;
  /**
   * CI: Next version message template
   * @type {string}
   */
  readonly nextVerMsg: string;
  /**
   * CI: Release version message template
   * @type {string}
   */
  readonly releaseVerMsg: string;
  /**
   * CI: Username to commit. Skip if any config visible in Runner git config
   * @type {string}
   */
  readonly userName: string;
  /**
   * CI: User email to commit. Skip if any config visible in Runner git config
   * @type {string}
   */
  readonly userEmail: string;

}

const defaultConfig: GitOpsConfig = {
  allowCommit: true,
  allowTag: true,
  correctVerMsg: 'Correct version',
  mustSign: false,
  nextVerMsg: 'Next version',
  prefixCiMsg: '<ci-auto-commit>',
  releaseVerMsg: 'Release version',
  userEmail: 'ci-bot',
  userName: 'actions@github.com',
};

export const createGitOpsConfig = (allowCommit: boolean, allowTag: boolean, prefixCiMsg: string, correctVerMsg: string,
  releaseVerMsg: string, username: string, userEmail: string, isSign: boolean, nextVerMsg: string): GitOpsConfig => {
  return {
    allowCommit: allowCommit ?? defaultConfig.allowCommit,
    allowTag: allowTag ?? defaultConfig.allowTag,
    mustSign: isSign ?? defaultConfig.mustSign,
    prefixCiMsg: prefixCiMsg ?? defaultConfig.prefixCiMsg,
    correctVerMsg: correctVerMsg ?? defaultConfig.correctVerMsg,
    releaseVerMsg: releaseVerMsg ?? defaultConfig.releaseVerMsg,
    nextVerMsg: nextVerMsg ?? defaultConfig.nextVerMsg,
    userName: username ?? defaultConfig.userName,
    userEmail: userEmail ?? defaultConfig.userEmail,
  };
};

/**
 * Represents for Git CI interactor like: commit, push, tag
 */
export class GitOps {

  private readonly config: GitOpsConfig;

  constructor(config: GitOpsConfig) {
    this.config = config;
  }

  static getCommitMsg = async (sha: string) => GitOps.execSilent(['log', '--format=%B', '-n', '1', sha]);

  static removeRemoteBranch = async (branch: string) => GitOps.execSilent(['push', 'origin', `:${branch}`]);

  static checkoutBranch = async (branch: string) => {
    await strictExec('git', ['fetch', '--depth=1'], 'Cannot fetch');
    await strictExec('git', ['checkout', branch], 'Cannot checkout');
  };

  private static execSilent = async (args: string[], fallback: string = ''): Promise<string> => {
    const r = await exec('git', args);
    if (!r.success) {
      core.warning(`Cannot exec GIT ${args[0]}: ${r.stderr}`);
    }
    return r.success ? r.stdout : fallback;
  };

  correctVersion = async (branch: string, version: string, dryRun: boolean): Promise<CIContext> => {
    if (!this.config.allowCommit || dryRun) {
      return { mustFixVersion: true, isPushed: false };
    }
    const commitMsg = `${this.config.prefixCiMsg} ${this.config.correctVerMsg} ${version}`;
    return core.group(`[GIT Commit] Correct version in branch ${branch} => ${version}...`,
      () => GitOps.checkoutBranch(branch)
        .then(() => this.commitThenPush(commitMsg))
        .then(commitId => ({ mustFixVersion: true, isPushed: true, commitMsg, commitId })));
  };

  upgradeVersion = async (nextVersion: string, dryRun: boolean): Promise<CIContext> => {
    if (!this.config.allowCommit || dryRun) {
      return { needUpgrade: true, isPushed: false };
    }
    const commitMsg = `${this.config.prefixCiMsg} ${this.config.nextVerMsg} ${nextVersion}`;
    return core.group(`[GIT Commit] Upgrade to new version to ${nextVersion}...`,
      () => this.commitThenPush(commitMsg)
        .then(commitId => ({ needUpgrade: true, isPushed: true, commitMsg, commitId })));
  };

  tagThenPush = async (tag: string, version: string, dryRun: boolean): Promise<CIContext> => {
    if (!this.config.allowTag || dryRun) {
      return { needTag: true, isPushed: false };
    }
    const commitMsg = `${this.config.releaseVerMsg} ${tag}`;
    const signArgs = this.config.mustSign ? ['-s'] : [];
    return core.group(`[GIT Tag] Tag new version ${tag}...`, () =>
      strictExec('git', ['fetch', '--depth=1'], 'Cannot fetch')
        .then(ignore => strictExec('git', ['rev-parse', '--short', 'HEAD'], 'Cannot show last commit'))
        .then(r => r.stdout)
        .then(commitId => (<CIContext>{ needTag: true, isPushed: true, commitMsg, commitId }))
        .then(ctx => this.configGitUser()
          .then(g => [...g, 'tag', ...signArgs, '-a', '-m', ctx.commitMsg!, tag, ctx.commitId!])
          .then(tagArgs => strictExec('git', tagArgs, `Cannot tag`))
          .then(() => strictExec('git', ['show', '--shortstat', '--show-signature', tag], `Cannot show tag`, false))
          .then(() => strictExec('git', ['push', '-uf', 'origin', tag], `Cannot push`, false))
          .then(() => ctx)));
  };

  private commitThenPush = async (commitMsg: string): Promise<string> => {
    const commitArgs = ['commit', ...this.config.mustSign ? ['-S'] : [], '-a', '-m', commitMsg];
    return this.configGitUser()
      .then(gc => strictExec('git', [...gc, ...commitArgs], `Cannot commit`))
      .then(() => strictExec('git', ['show', '--shortstat', '--show-signature'], `Cannot show recently commit`, false))
      .then(() => strictExec('git', ['push'], `Cannot push`, false))
      .then(() => strictExec('git', ['rev-parse', 'HEAD'], 'Cannot show last commit'))
      .then(r => r.stdout);
  };

  private configGitUser = async (): Promise<string[]> => {
    const userName = await GitOps.execSilent(['config', 'user.name'], this.config.userName);
    const userEmail = await GitOps.execSilent(['config', 'user.email'], this.config.userEmail);
    return Promise.resolve(['-c', `user.name=${userName}`, '-c', `user.email=${userEmail}`]);
  };
}
