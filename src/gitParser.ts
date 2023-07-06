import { Context } from '@actions/github/lib/context';
import { RuntimeContext, RuntimeVersion } from './runtimeContext';
import { isEmpty, isNotEmpty, isNumeric, removeEmptyProperties } from './utils';

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
   * Git Hotfix Prefix
   * @type {string}
   */
  readonly hotfixPrefix: string;
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
  mergedReleaseMsgRegex: new RegExp('^Merge pull request #[0-9]+ from .+\/release\/.+$', 'gim'),
  releaseBranchPrefix: 'release/',
  hotfixPrefix: 'hotfix/',
  shaLength: 7,
  tagPrefix: 'v',
};

export const createGitParserConfig = (defaultBranch?: string, tagPrefix?: string, hotfixPrefix?: string,
  releaseBranchPrefix?: string, mergedReleaseMsg?: string, shaLength?: number): GitParserConfig => {
  return {
    ...defaultConfig, ...removeEmptyProperties(<GitParserConfig>{
      defaultBranch, tagPrefix, releaseBranchPrefix, hotfixPrefix,
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

const getPrBaseBranch = (ctx: Context, isPR: boolean): string => isPR ? ctx.payload.pull_request?.base?.ref : undefined;

const checkDefBranch = (context: Context, defBranch: string): boolean => context.ref === `refs/heads/${defBranch}`;

const checkMerged = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                         context.payload.pull_request?.merged === true;

const checkClosed = (context: Context, isPR: boolean) => isPR && context.payload.action === 'closed' &&
                                                         context.payload.pull_request?.merged === false;

const checkOpen = (context: Context, isPR: boolean) => isPR && context.payload.action === 'opened' ||
                                                       context.eventName === 'create';

const supportTriggerEvent = (event: string) => ['create', 'push', 'pull_request'].includes(event);

const getCommitId = (context: Context, isPR: boolean, isNotMerged: boolean): string => isPR && isNotMerged
  ? (context.payload.pull_request?.head?.sha ?? context.sha) : context.sha;

const getShortCommitId = (commitId: string, len: number): string => commitId.substring(0, len);

export class GitParser {

  private readonly config: GitParserConfig;

  constructor(gitParserConfig: GitParserConfig) {
    this.config = gitParserConfig;
  }

  private parseVersion(branch: string, isTag: boolean, isHotfix: boolean, isRelease: boolean) {
    let branchPrefix: string = '';
    if (isRelease) branchPrefix = this.config.releaseBranchPrefix;
    if (isRelease && isHotfix) branchPrefix += this.config.hotfixPrefix;
    if (isTag) branchPrefix = this.config.tagPrefix;
    const branchName = isEmpty(branchPrefix) ? branch : branch.replace(new RegExp(`^${branchPrefix}`), '');
    return <RuntimeVersion>{ branch: branchName };
  }

  private checkAfterMergedReleasePR(event: string, isOnDefault: boolean, isHotfix: boolean, commitMsg: string) {
    return event === 'push' && (isOnDefault || isHotfix) &&
           isNotEmpty(commitMsg?.trim().match(this.config.mergedReleaseMsgRegex));
  }

  parse(ghContext: Context): RuntimeContext {
    const event = ghContext.eventName;
    const commitMsg = ghContext.payload?.head_commit?.message;
    const isPR = checkPR(event);
    const isTag = checkTag(ghContext);
    const isBranch = !isPR && !isTag;
    const isSchedule = checkSchedule(event);
    const isDispatch = checkDispatchEvent(event);
    const defaultBranch = getDefBranch(ghContext, this.config.defaultBranch);
    const branch = getBranchName(ghContext, isPR, isTag);
    const onDefaultBranch = checkDefBranch(ghContext, defaultBranch);
    const isMerged = checkMerged(ghContext, isPR);
    const isClosed = checkClosed(ghContext, isPR);
    const isOpened = checkOpen(ghContext, isPR);
    const isRelease = supportTriggerEvent(event) &&
                      branch.startsWith(isTag ? this.config.tagPrefix : this.config.releaseBranchPrefix);
    const isHotfix = supportTriggerEvent(event) &&
                     branch.startsWith((isRelease ? this.config.releaseBranchPrefix : '') + this.config.hotfixPrefix);
    const versions = this.parseVersion(branch, isTag, isHotfix, isRelease);
    const isAfterMergedReleasePR = this.checkAfterMergedReleasePR(event, onDefaultBranch, isHotfix, commitMsg);
    const commitId = getCommitId(ghContext, isPR, !isMerged);
    const commitShortId = getShortCommitId(commitId, this.config.shaLength);
    const prBaseBranch = getPrBaseBranch(ghContext, isPR);
    return {
      branch, defaultBranch, onDefaultBranch, prBaseBranch,
      isSchedule, isDispatch, isBranch, isPR, isTag,
      isHotfix, isRelease, isAfterMergedReleasePR, isMerged, isClosed, isOpened,
      commitMsg, commitId, commitShortId, versions,
    };
  }
}
