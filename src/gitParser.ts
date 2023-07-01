import { Context } from '@actions/github/lib/context';
import { RuntimeContext, RuntimeVersions } from './runtimeContext';
import { isEmpty, isNumeric, removeEmptyProperties } from './utils';

export type GitParserConfig = {
  /**
   * Default branch name
   * @type {string}
   */
  readonly defaultBranch: string;
  /**
   * Git Tag Prefix
   * @type {string}
   */
  readonly tagPrefix: string;
  /**
   * Git Release Branch Prefix
   * @type {string}
   */
  readonly releaseBranchPrefix: string;
  /**
   * Merged release message regex
   * @type {string}
   */
  readonly mergedReleaseMsgRegex: RegExp;
  /**
   * Commit id length
   * @type {number}
   */
  readonly shaLength: number;
}

const defaultConfig: GitParserConfig = {
  defaultBranch: 'main',
  mergedReleaseMsgRegex: new RegExp('^Merge pull request #[0-9]+ from .+/release/.+$', 'gim'),
  releaseBranchPrefix: 'release/',
  shaLength: 7,
  tagPrefix: 'v',
};

export const createGitParserConfig = (defaultBranch?: string, tagPrefix?: string, releaseBranchPrefix?: string,
  mergedReleaseMsg?: string, shaLength?: number): GitParserConfig => {
  return {
    ...defaultConfig, ...removeEmptyProperties({
      defaultBranch, tagPrefix, releaseBranchPrefix,
      mergedReleaseMsgRegex: isEmpty(mergedReleaseMsg) ? null : new RegExp(mergedReleaseMsg!, 'gim'),
      shaLength: isNumeric(shaLength) ? +shaLength! : null,
    }),
  };
};

export class GitParser {

  private readonly config: GitParserConfig;

  constructor(gitParserConfig: GitParserConfig) {
    this.config = gitParserConfig;
  }

  static parseBranch = (context: Context, isPR: boolean, isTag: boolean): string => isPR
    ? context.payload.pull_request?.head?.ref
    : context.ref.replace(isTag ? 'refs/tags/' : 'refs/heads/', '');

  static getCommitId = (context: Context, isPR: boolean, isNotMerged: boolean): string => isPR && isNotMerged
    ? (context.payload.pull_request?.head?.sha ?? context.sha) : context.sha;

  static getShortCommitId = (commitId: string, len: number): string => commitId.substring(0, len);

  static checkPR = (event: string): boolean => event === 'pull_request';

  static checkManualOrSchedule = (event: string) => ['schedule', 'workflow_dispatch', 'repository_dispatch'].includes(
    event);

  static checkMerged = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                            context.payload.pull_request?.merged === true;

  static checkClosed = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                            context.payload.pull_request?.merged === false;

  static checkReleaseBranch = (event: string, branch: string, releaseBranchPrefix: string): boolean =>
    ['push', 'create'].includes(event) && branch?.startsWith(releaseBranchPrefix);

  static checkReleasePR = (event: string, branch: string, releaseBranchPrefix: string): boolean =>
    GitParser.checkPR(event) && branch?.startsWith(releaseBranchPrefix);

  static getDefBranch = (ctx: Context, configDefBranch: string): string =>
    ctx.payload.repository?.default_branch ?? configDefBranch;

  static checkDefBranch = (context: Context, event: string, defBranch: string): boolean =>
    event === 'push' && context.ref === `refs/heads/${defBranch}`;

  static checkTag = (context: Context, event: string, tagPrefix: string): boolean =>
    event === 'push' && context.ref.startsWith(`refs/tags/${tagPrefix}`);

  // @formatter:off
  static checkAfterMergedReleasePR = (event: string, isOnDefault: boolean, commitMsg: string,
    mergedReleaseRegex: RegExp): boolean => event === 'push' && isOnDefault && mergedReleaseRegex.test(commitMsg?.trim());
  // @formatter:on

  static parseVersion = (branch: string, isReleasePR: boolean, releaseBranchPrefix: string, isTag: boolean,
    tagPrefix: string): RuntimeVersions => {
    if (isReleasePR) {
      return { branch: branch.replace(new RegExp(`^${releaseBranchPrefix}`), '') };
    }
    if (isTag) {
      return { branch: branch.replace(new RegExp(`^${tagPrefix}`), '') };
    }
    return { branch };
  };

  parse(ghContext: Context): RuntimeContext {
    const { shaLength, releaseBranchPrefix, defaultBranch: defBranch, tagPrefix, mergedReleaseMsgRegex } = this.config;
    const event = ghContext.eventName;
    const commitMsg = ghContext.payload?.head_commit?.message;
    const isPR = GitParser.checkPR(event);
    const isTag = GitParser.checkTag(ghContext, event, tagPrefix);
    const branch = GitParser.parseBranch(ghContext, isPR, isTag);
    const defaultBranch = GitParser.getDefBranch(ghContext, defBranch);
    const onDefaultBranch = GitParser.checkDefBranch(ghContext, event, defaultBranch);
    const isReleaseBranch = GitParser.checkReleaseBranch(event, branch, releaseBranchPrefix);
    const isReleasePR = GitParser.checkReleasePR(event, branch, releaseBranchPrefix);
    const isManualOrSchedule = GitParser.checkManualOrSchedule(event);
    const isMerged = GitParser.checkMerged(ghContext, isPR);
    const isClosed = GitParser.checkClosed(ghContext, isPR);
    const commitId = GitParser.getCommitId(ghContext, isPR, !isMerged);
    const shortCommitId = GitParser.getShortCommitId(commitId, shaLength);
    // @formatter:off
    const isAfterMergedReleasePR = GitParser.checkAfterMergedReleasePR(event, onDefaultBranch, commitMsg, mergedReleaseMsgRegex);
    // @formatter:on
    const versions = GitParser.parseVersion(branch, isReleasePR || isReleaseBranch,
      releaseBranchPrefix, isTag, tagPrefix);
    return {
      branch, defaultBranch, onDefaultBranch,
      isManualOrSchedule, isPR, isReleaseBranch, isReleasePR, isTag,
      isAfterMergedReleasePR, isMerged, isClosed,
      commitMsg, commitId, shortCommitId, versions,
    };
  }
}
