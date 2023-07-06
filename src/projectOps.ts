import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { ChangelogOps, ChangelogResult } from './changelog';
import { isPullRequestAvailable, openPullRequest, PullRequestContent } from './githubApi';
import { CommitStatus, GitOps, mergeCommitStatus } from './gitOps';
import { GitParser } from './gitParser';
import { ProjectConfig } from './projectConfig';
import { Decision, ProjectContext } from './projectContext';
import { ReleaseVersionOps } from './releaseVersionOps';
import { RuntimeContext } from './runtimeContext';
import { isEmpty, prettier } from './utils';
import { findPreviousVersion } from './versionStrategy';

const normalizeCommitMsg = async (context: RuntimeContext): Promise<RuntimeContext> => {
  if (!isEmpty(context.commitMsg)) {
    return context;
  }
  const commitMsg = await GitOps.getCommitMsg(context.commitId);
  return ({ ...context, commitMsg });
};

export const makeDecision = (context: RuntimeContext, ciPushed: boolean): Decision => {
  const notBuild = ciPushed || context.isClosed || context.isMerged ||
                   (context.isBranch && (context.isRelease || context.isOpened)) || context.isAfterMergedReleasePR;
  const build = !notBuild;
  const publish = build && (context.onDefaultBranch || (context.isRelease && context.isTag));
  return { build, publish };
};

export class ProjectOps {

  readonly projectConfig: ProjectConfig;
  private readonly gitParser: GitParser;
  private readonly gitOps: GitOps;
  private readonly changelogOps: ChangelogOps;
  private readonly versionOps: ReleaseVersionOps;

  constructor(projectConfig: ProjectConfig) {
    this.projectConfig = projectConfig;
    this.gitOps = new GitOps(this.projectConfig.gitOpsConfig);
    this.gitParser = new GitParser(this.projectConfig.gitParserConfig);
    this.changelogOps = new ChangelogOps(this.projectConfig.changelogConfig);
    this.versionOps = new ReleaseVersionOps(this.projectConfig.versionStrategy);
  }

  process(ghContext: Context, dryRun: boolean): Promise<ProjectContext> {
    return this.parse(ghContext)
      .then(runtime => this.buildContext(runtime, dryRun))
      .then(ctx => this.removeBranchIfNeed(ctx, dryRun));
  };

  private parse(ghContext: Context): Promise<RuntimeContext> {
    return core.group('[CI::Process] Runtime context',
      async () => {
        core.debug(`The GitHub context: ${prettier(ghContext, 'nope')}`);
        const runtime = await normalizeCommitMsg(this.gitParser.parse(ghContext));
        core.info(JSON.stringify(runtime, Object.keys(runtime).sort(), 2));
        return runtime;
      });
  }

  private removeBranchIfNeed = async (context: ProjectContext, dryRun: boolean): Promise<ProjectContext> => {
    if (context.isPR && context.isMerged && !dryRun) {
      await core.group(`[CI::Process] Removing branch ${context.branch}...`,
        () => GitOps.removeRemoteBranch(context.branch));
    }
    return context;
  };

  private async buildContext(context: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    return core.group(`[CI::Process] Evaluating context on ${context.branch}...`,
      () => context.isRelease
        ? this.buildContextWhenRelease(context, dryRun)
        : this.buildContextOnAnotherBranch(context, dryRun));
  }

  private async buildContextOnAnotherBranch(ctx: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    const result = await this.versionOps.upgrade(ctx, dryRun);
    const pushStatus = await this.commitPushNext(ctx.branch, result.needUpgrade, result.versions.bumped, dryRun);
    return {
      ...ctx, version: result.versions.current, versions: result.versions,
      ci: { ...pushStatus, needUpgrade: result.needUpgrade },
      decision: makeDecision(ctx, pushStatus.isPushed),
    };
  }

  private async commitPushNext(branch: string, needUpgrade: boolean, nextVersion: string | undefined, dryRun: boolean) {
    if (!needUpgrade) {
      return { isPushed: false, isCommitted: false };
    }
    return await this.gitOps.commitVersionUpgrade(branch, nextVersion!).then(s => this.gitOps.pushCommit(s, dryRun));
  }

  private async buildContextWhenRelease(ctx: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    const result = await this.versionOps.fix(ctx, dryRun);
    const version = result.versions.current;
    const tag = `${this.projectConfig.gitParserConfig.tagPrefix}${version}`;
    if (result.needTag) {
      const pushStatus = await this.gitOps.tag(tag).then(s => this.gitOps.pushTag(tag, s, dryRun));
      const isOpenedPR = ctx.isHotfix &&
                         await this.createPullRequest(ctx.defaultBranch, ctx.prBaseBranch!, {
                           title: `Apply hotfix ${tag} patch`,
                           body: `:warning: Action required: need to merge or rebase from ${ctx.defaultBranch} into ${ctx.prBaseBranch} :warning:`,
                         }, dryRun);
      return {
        ...ctx, version, versions: result.versions,
        ci: {
          ...pushStatus,
          mustFixVersion: result.mustFixVersion,
          needTag: result.needTag,
          needPullRequest: isOpenedPR,
        },
        decision: makeDecision(ctx, pushStatus.isPushed),
      };
    }
    const fixedStatus = result.mustFixVersion ? await this.gitOps.commitVersionCorrection(ctx.branch, version) : {};
    const changelog = await this.genChangelog(ctx.branch, version, ctx.isTag, ctx.prBaseBranch, dryRun);
    const commitStatus = mergeCommitStatus(<CommitStatus>fixedStatus, changelog);
    const pushStatus = await this.gitOps.pushCommit(commitStatus, dryRun);
    const isOpenedPR = result.needPullRequest &&
                       await this.createPullRequest(ctx.defaultBranch, ctx.branch, { title: `Release ${tag}` }, dryRun);
    return {
      ...ctx, version, versions: result.versions,
      ci: { ...pushStatus, mustFixVersion: result.mustFixVersion, needPullRequest: isOpenedPR, changelog },
      decision: makeDecision(ctx, pushStatus.isPushed),
    };
  }

  private async createPullRequest(base: string, head: string, content: PullRequestContent, dryRun: boolean) {
    return core.group(`[GitHub] Opening a Pull Request from ${head} into ${base}...`, async () => {
      const parameters = { base, head };
      const isAvailable = await isPullRequestAvailable(parameters);
      if (isAvailable || dryRun) {
        core.info(`[GitHub] Pull request is available or in dry-run mode. Skip to create Pull request.`);
      } else {
        const token = this.projectConfig.token;
        if (isEmpty(token)) {
          core.warning(`[GitHub] GitHub token is required to able to create new Pull Request.`);
        } else {
          const url = await openPullRequest({ ...parameters, token }, content);
          core.info(`[GitHub] New Pull request: ${url}`);
        }
      }
      return !isAvailable;
    });
  }

  private async genChangelog(branch: string, version: string, isTag: boolean, releaseBranch: string | undefined,
    dryRun: boolean): Promise<ChangelogResult> {
    const tagPrefix = this.projectConfig.gitParserConfig.tagPrefix;
    const sinceTag = await GitOps.getTags(tagPrefix).then(versions => findPreviousVersion(version, versions));
    const releaseTag = tagPrefix + version;
    const result = await this.changelogOps.generate(sinceTag, releaseTag, releaseBranch, dryRun);
    if (result.generated) {
      if (isTag) {
        throw `Changelog [${releaseTag}] is missing in tag`;
      }
      return { ...result, ...(await this.gitOps.commit(branch, result.commitMsg!)) };
    }
    return { ...result, isCommitted: false };
  }

}

