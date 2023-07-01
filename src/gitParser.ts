import { Context } from '@actions/github/lib/context';
import { RuntimeContext, RuntimeVersion } from './runtimeContext';
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

const checkPR = (event: string): boolean => event === 'pull_request';

const checkSchedule = (event: string) => event === 'schedule';

const checkDispatchEvent = (event: string) => ['workflow_dispatch', 'repository_dispatch'].includes(event);

const checkTag = (ctx: Context): boolean => ctx.ref.startsWith(`refs/tags/`);

const getDefBranch = (ctx: Context, configDefBranch: string): string => ctx.payload.repository?.default_branch ??
                                                                        configDefBranch;

const getBranchName = (context: Context, isPR: boolean, isTag: boolean): string => isPR
  ? context.payload.pull_request?.head?.ref
  : context.ref.replace(isTag ? 'refs/tags/' : 'refs/heads/', '');

const checkDefBranch = (context: Context, defBranch: string): boolean => context.ref === `refs/heads/${defBranch}`;

const checkMerged = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                         context.payload.pull_request?.merged === true;

const checkClosed = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                         context.payload.pull_request?.merged === false;

const checkOpen = (context: Context, isPR: boolean) => isPR && context.payload.action === 'opened' ||
                                                       context.eventName === 'create';

const isReleaseEvent = (event: string) => ['create', 'push', 'pull_request'].includes(event);

// @formatter:off
const checkAfterMergedReleasePR = (event: string, isOnDefault: boolean, commitMsg: string, mergedReleaseRegex: RegExp): boolean =>
  event === 'push' && isOnDefault && mergedReleaseRegex.test(commitMsg?.trim());
// @formatter:on

// @formatter:off
const parseVersion = (branch: string, isTag: boolean, isRelease: boolean, releasePrefix: string, tagPrefix: string): RuntimeVersion => {
// @formatter:on
  if (!isRelease) {
    return { branch };
  }
  if (isTag) {
    return { branch: branch.replace(new RegExp(`^${tagPrefix}`), '') };
  }
  return { branch: branch.replace(new RegExp(`^${releasePrefix}`), '') };
};

const getCommitId = (context: Context, isPR: boolean, isNotMerged: boolean): string => isPR && isNotMerged
  ? (context.payload.pull_request?.head?.sha ?? context.sha) : context.sha;

const getShortCommitId = (commitId: string, len: number): string => commitId.substring(0, len);

export class GitParser {

  private readonly config: GitParserConfig;

  constructor(gitParserConfig: GitParserConfig) {
    this.config = gitParserConfig;
  }

  parse(ghContext: Context): RuntimeContext {
    const { shaLength, releaseBranchPrefix, defaultBranch: defBranch, tagPrefix, mergedReleaseMsgRegex } = this.config;
    const event = ghContext.eventName;
    const commitMsg = ghContext.payload?.head_commit?.message;
    const isPR = checkPR(event);
    const isTag = checkTag(ghContext);
    const isBranch = !isPR && !isTag;
    const isSchedule = checkSchedule(event);
    const isDispatch = checkDispatchEvent(event);
    const defaultBranch = getDefBranch(ghContext, defBranch);
    const branch = getBranchName(ghContext, isPR, isTag);
    const onDefaultBranch = checkDefBranch(ghContext, defaultBranch);
    const isRelease = isReleaseEvent(event) &&
                      (isTag ? branch.startsWith(tagPrefix) : branch.startsWith(releaseBranchPrefix));
    const isMerged = checkMerged(ghContext, isPR);
    const isClosed = checkClosed(ghContext, isPR);
    const isOpened = checkOpen(ghContext, isPR);
    const isAfterMergedReleasePR = checkAfterMergedReleasePR(event, onDefaultBranch, commitMsg, mergedReleaseMsgRegex);
    const commitId = getCommitId(ghContext, isPR, !isMerged);
    const commitShortId = getShortCommitId(commitId, shaLength);
    const versions = parseVersion(branch, isTag, isRelease, releaseBranchPrefix, tagPrefix);
    return {
      branch, defaultBranch, onDefaultBranch,
      isSchedule, isDispatch, isBranch, isPR, isTag,
      isRelease, isAfterMergedReleasePR, isMerged, isClosed, isOpened,
      commitMsg, commitId, commitShortId, versions,
    };
  }
}
