import { Context } from '@actions/github/lib/context';
import { strictExec } from './exec';
import { VersionResult } from './project';

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

export interface GitContextOutput {
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
   * Check whether current event is merged PR
   * @type {boolean}
   */
  readonly isMerged: boolean;
  /**
   * Check whether current event is close PR but not merged into target branch
   * @type {boolean}
   */
  readonly isClosed: boolean;
  /**
   * Check whether current event is on ref tag
   * @type {boolean}
   */
  readonly isTag: boolean;
  /**
   * Check whether manual or schedule event
   */
  readonly isManualOrSchedule: boolean;
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
  /**
   * CI context
   */
  readonly ci?: CIContext;
}

export interface CIContext {
  /**
   * Need to fix version to match with release name
   */
  readonly mustFixVersion: boolean;
  /**
   * Need to tag new version if release branch is merged
   */
  readonly needTag: boolean;
  /**
   * Check whether if auto commit is pushed to remote
   */
  readonly isPushed: boolean;
  /**
   * CI auto commit id
   */
  readonly commitId?: string;
  /**
   * CI auto commit message
   */
  readonly commitMsg?: string;
}

export class GitContextOps {

  readonly ctxInput: GitContextInput;

  constructor(ctxInput: GitContextInput) {
    this.ctxInput = ctxInput;
  }

  parse(context: Context): GitContextOutput {
    const event = context.eventName;
    const commitMsg = context.payload.head_commit?.message;
    const isTag = this.checkTag(event, context.ref);
    const isPR = this.checkPR(event);
    const branch = this.parseBranch(context, isPR, isTag);
    const onDefaultBranch = this.checkDefBranch(event, context.ref);
    const isReleasePR = this.checkReleasePR(event, branch);
    const isManualOrSchedule = event === 'schedule' || event === 'workflow_dispatch' || event === 'repository_dispatch';
    return {
      branch, onDefaultBranch, isPR, isReleasePR, isTag, commitMsg, isManualOrSchedule,
      isAfterMergedReleasePR: this.checkAfterMergedReleasePR(event, onDefaultBranch, commitMsg),
      commitId: this.getCommitId(context, isPR), version: this.getVersion(branch, isReleasePR, isTag),
      isMerged: this.checkMerged(context, isPR), isClosed: this.checkClosed(context, isPR),
    };
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

  private checkMerged(context: Context, isPR: boolean) {
    return isPR && context.payload.action === 'closed' && context.payload.pull_request?.merged === true;
  }

  private checkClosed(context: Context, isPR: boolean) {
    return isPR && context.payload.action === 'closed' && context.payload.pull_request?.merged === false;
  }
}

/**
 * Represents for Git CI input
 */
export class GitInteractorInput {

  static readonly PREFIX_CI_MSG = '<ci-auto-commit>';
  static readonly CORRECT_VERSION_MSG = 'Correct version';
  static readonly RELEASE_VERSION_MSG = 'Release version';

  /**
   * Allow commit to fix version if not match
   * @type {boolean}
   */
  readonly allowCommit: boolean;
  /**
   * Allow tag in post script if merged release branch
   * @type {boolean}
   */
  readonly allowTag: boolean;
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
   * CI: Release version message template
   * @type {string}
   */
  readonly releaseVerMsg: string;
  /**
   * CI: User name to commit
   * @type {string}
   */
  readonly userName: string;
  /**
   * CI: User email to commit
   * @type {string}
   */
  readonly userEmail: string;

  constructor(allowCommit: boolean, allowTag: boolean, prefixCiMsg: string, correctVerMsg: string,
              releaseVerMsg: string, username: string, userEmail: string) {
    this.allowCommit = allowCommit ?? true;
    this.allowTag = allowTag ?? true;
    this.prefixCiMsg = prefixCiMsg ?? GitInteractorInput.PREFIX_CI_MSG;
    this.correctVerMsg = correctVerMsg ?? GitInteractorInput.CORRECT_VERSION_MSG;
    this.releaseVerMsg = releaseVerMsg ?? GitInteractorInput.RELEASE_VERSION_MSG;
    this.userName = username ?? 'ci-bot';
    this.userEmail = userEmail ?? 'actions@github.com';
  }
}

/**
 * Represents for Git CI interactor like: commit, push, tag
 */
export class GitInteractor {

  readonly interactorInput: GitInteractorInput;

  constructor(interactorInput: GitInteractorInput) {
    this.interactorInput = interactorInput;
  }

  fixVersionThenCommitPush = async (version: string, versionResult: VersionResult,
                                    dryRun: boolean): Promise<CIContext> => {
    const committable = this.interactorInput.allowCommit && versionResult.isChanged && !dryRun;
    let commitMsg = '';
    let commitId = '';
    if (committable) {
      commitMsg = `${this.interactorInput.prefixCiMsg} ${this.interactorInput.correctVerMsg} ${version}`;
      await strictExec('git', [...this.commitConfig(), 'commit', '-S', '-am', commitMsg], true, `Cannot commit`);
      await strictExec('git', ['show', '--shortstat', '--show-signature'], false, `Cannot show commit`);
      await strictExec('git', ['push'], true, `Cannot push`);
      commitId = (await strictExec('git', ['rev-parse', 'HEAD'], true, 'Cannot show last commit')).stdout;
    }
    return Promise.resolve({
                             mustFixVersion: versionResult.isChanged, needTag: false,
                             isPushed: committable, commitMsg, commitId,
                           });
  };

  tagThenPush = async (version: string, needTag: boolean, dryRun: boolean): Promise<CIContext> => {
    const taggable = this.interactorInput.allowTag && needTag && !dryRun;
    const v = `v${version}`;
    let commitMsg = '';
    let commitId = '';
    if (taggable) {
      commitMsg = `${this.interactorInput.releaseVerMsg} ${v}`;
      commitId = (await strictExec('git', ['rev-parse', '--short', 'HEAD'], true, 'Cannot show last commit')).stdout;
      await strictExec('git', [...this.commitConfig(), 'tag', '-as', '-m', `${commitMsg}`, v, commitId], true,
                       `Cannot tag`);
      await strictExec('git', ['show', '--shortstat', '--show-signature', v], false, `Cannot show tag`);
      await strictExec('git', ['push', v], true, `Cannot push`);
    }
    return Promise.resolve({ mustFixVersion: false, needTag: needTag, isPushed: taggable, commitMsg, commitId });
  };

  private commitConfig(): string[] {
    return ['-c', 'user.name', this.interactorInput.userName, '-c', 'user.email', this.interactorInput.userEmail];
  };
}