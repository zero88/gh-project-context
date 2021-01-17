import github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { exec, ExecResult } from './exec';

/**
 * Declares Git context Input
 */
export class GitContextInput {

  static readonly DEFAULT_BRANCH = 'main';
  static readonly TAG_PREFIX = 'v';
  static readonly RELEASE_BRANCH_PREFIX = 'release/';
  static readonly MERGED_RELEASE_MSG_REGEX = '^Merge pull request #\\d+ from .+/release/.+$';

  /**
   * Default branch name
   * @type {string}
   */
  readonly defaultBranch: string;
  readonly tagPrefix: string;
  readonly releaseBranchPrefix: string;
  readonly mergedReleaseMsgRegex: string;

  constructor(defaultBranch: string, tagPrefix: string, releaseBranchPrefix: string, mergedReleaseMsgRegex: string) {
    this.defaultBranch = defaultBranch ?? GitContextInput.DEFAULT_BRANCH;
    this.tagPrefix = tagPrefix ?? GitContextInput.TAG_PREFIX;
    this.releaseBranchPrefix = releaseBranchPrefix ?? GitContextInput.RELEASE_BRANCH_PREFIX;
    this.mergedReleaseMsgRegex = mergedReleaseMsgRegex ?? GitContextInput.MERGED_RELEASE_MSG_REGEX;
  }
}

export class GitContextOutput {
  /**
   * Current branch name or tag name
   */
  readonly branch: string;
  /**
   * Check whether current event is on default branch or not
   * @type {boolean}
   */
  readonly onDefaultBranch: boolean;
  /**
   * Check whether current event is on pull request or not
   * @type {boolean}
   */
  readonly isPR: boolean;
  /**
   * Check whether current event is on release pull request or not
   * @type {boolean}
   */
  readonly isReleasePR: boolean;
  /**
   * Check whether current event is a merged commit after merged release pull request into default branch or not
   * @type {boolean}
   */
  readonly isAfterMergedReleasePR: boolean;
  /**
   * Check whether current event is on ref tag
   * @type {boolean}
   */
  readonly isTag: boolean;
  /**
   * Current tag version or release version. Null if not tag or release pull request
   * @type {string}
   */
  readonly version: string;
  /**
   * Latest commit message
   * @type {string}
   */
  readonly commitMsg: string;
  /**
   * Latest commit id
   * @type {string}
   */
  readonly commitId: string;

  constructor(branch: string, onDefaultBranch: boolean, isPR: boolean, isReleasePR: boolean, isTag: boolean,
              isAfterMergedReleasePR: boolean, commitMsg: string, commitId: string, version: string) {
    this.branch = branch;
    this.onDefaultBranch = onDefaultBranch;
    this.isPR = isPR;
    this.isReleasePR = isReleasePR;
    this.isAfterMergedReleasePR = isAfterMergedReleasePR;
    this.isTag = isTag;
    this.version = version;
    this.commitMsg = commitMsg;
    this.commitId = commitId;
  }

}

export class GitContextOps {

  readonly ctxInput: GitContextInput;

  constructor(ctxInput: GitContextInput) {
    this.ctxInput = ctxInput;
  }

  parse(): GitContextOutput {
    const context = github.context;
    const event = context.eventName;
    const commitMsg = context.payload.head_commit?.message;
    const isTag = this.checkTag(event, context.ref);
    const isPR = this.checkPR(event);
    const branch = this.parseBranch(context, isPR, isTag);
    const onDefaultBranch = this.checkDefBranch(event, context.ref);
    const isReleasePR = this.checkReleasePR(event, branch);
    return new GitContextOutput(branch, onDefaultBranch, isPR, isReleasePR, isTag,
                                this.checkAfterMergedReleasePR(event, onDefaultBranch, commitMsg), commitMsg,
                                this.getCommitId(context, isPR), this.getVersion(branch, isReleasePR, isTag));
  }

  private parseBranch(context: Context, isPR: boolean, isTag: boolean): string {
    return isPR ? context.payload.pull_request?.head?.ref
                : context.ref.replace(isTag ? 'refs/tags/' : 'refs/heads/', '');
  }

  private checkDefBranch(event: string, ref: string): boolean {
    return event === 'push' && ref === `refs/heads/${this.ctxInput.defaultBranch}`;
  }

  private checkPR(event: string): boolean {
    return event === 'pull_request';
  }

  private checkReleasePR(event: string, branch: string): boolean {
    return this.checkPR(event) && branch?.startsWith(this.ctxInput.releaseBranchPrefix);
  }

  private checkTag(event: string, ref: string): boolean {
    return event === 'push' && ref.startsWith(`refs/tags/${this.ctxInput.tagPrefix}`);
  }

  private checkAfterMergedReleasePR(event: string, onDefaultBranch: boolean, commitMsg: string): boolean {
    return event === 'push' && onDefaultBranch && new RegExp(this.ctxInput.mergedReleaseMsgRegex, 'gi').test(commitMsg);
  }

  private getCommitId(context: Context, isPR: boolean): string {
    return isPR ? context.payload.pull_request?.head?.sha : context.sha;
  }

  private getVersion(branch: string, isReleasePR: boolean, isTag: boolean) {
    if (isTag) {
      return branch.replace(new RegExp(`^${this.ctxInput.tagPrefix}`), '');
    }
    if (isReleasePR) {
      return branch.replace(new RegExp(`^${this.ctxInput.releaseBranchPrefix}`), '');
    }
    return '';
  }
}

/**
 * Represents for Git CI input
 */
export class GitInteractorInput {

  static readonly PREFIX_CI_MSG = '<ci-auto-commit>';
  static readonly CORRECT_VERSION_MSG = 'Correct version';
  static readonly RELEASE_VERSION_MSG = 'Release version';

  readonly prefixCiMsg: string;
  readonly correctVerMsg: string;
  readonly releaseVerMsg: string;

  constructor(prefixCiMsg: string, correctVerMsg: string, releaseVerMsg: string) {
    this.prefixCiMsg = prefixCiMsg ?? GitInteractorInput.PREFIX_CI_MSG;
    this.correctVerMsg = correctVerMsg ?? GitInteractorInput.CORRECT_VERSION_MSG;
    this.releaseVerMsg = releaseVerMsg ?? GitInteractorInput.RELEASE_VERSION_MSG;
  }
}

/**
 * Represents for Git CI interactor like: commit, push, tag
 */
export class GitInteractor {
  commitThenPush = (msg = '<ci-auto-commit> Correct version'): Promise<ExecResult> => {
    return exec('git', ['commit', '-S', '-am', msg])
      .then(_ => exec('git', ['show', '--shortstat', '--show-signature']))
      .then(_ => exec('git', ['push']));
  };

  tagThenPush = async (version: string, commitId?: string, msg = 'Release version'): Promise<ExecResult> => {
    const v = `v${version}`;
    return (commitId ? Promise.resolve(commitId) : exec('git rev-parse --short HEAD').then(r => r.stdout))
      .then(sha => exec('git', ['tag', '-as', '-m', `${msg} ${version}`, v, sha]))
      .then(_ => exec('git', ['show', '--shortstat', '--show-signature', v]))
      .then(_ => exec('git', ['push', v]));
  };
}