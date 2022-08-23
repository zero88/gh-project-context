import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { ChangelogConfig, ChangelogOps, ChangelogResult } from './changelog';
import { GitOps, GitOpsConfig } from './gitOps';
import { GitParser, GitParserConfig } from './gitParser';
import { CIContext, Decision, ProjectContext, Versions } from './projectContext';
import { RuntimeContext } from './runtimeContext';
import { isEmpty } from './utils';
import { VersionPatternParser } from './versionPatternParser';
import { createVersions, getNextVersion, VersionResult, VersionStrategy } from './versionStrategy';

export type ProjectConfig = {

  readonly gitParserConfig: GitParserConfig;
  readonly gitOpsConfig: GitOpsConfig;
  readonly versionStrategy: VersionStrategy;
  readonly changelogConfig: ChangelogConfig;

}

export class ProjectOps {

  readonly projectConfig: ProjectConfig;
  private readonly gitParser: GitParser;
  private readonly gitOps: GitOps;
  private readonly changelogOps: ChangelogOps;

  constructor(projectConfig: ProjectConfig) {
    this.projectConfig = projectConfig;
    this.gitParser = new GitParser(this.projectConfig.gitParserConfig);
    this.gitOps = new GitOps(this.projectConfig.gitOpsConfig);
    this.changelogOps = new ChangelogOps(projectConfig.changelogConfig);
  }

  private static makeDecision = (context: RuntimeContext, ci: CIContext): Decision => {
    const build = !context.isClosed && !context.isMerged && !ci.isPushed && !context.isAfterMergedReleasePR;
    const publish = build && (context.onDefaultBranch || context.isTag);
    return { build, publish };
  };

  private static normalizeCommitMsg = async (context: RuntimeContext): Promise<RuntimeContext> => {
    if (!isEmpty(context.commitMsg)) {
      return context;
    }
    const commitMsg = await GitOps.getCommitMsg(context.commitId);
    return ({ ...context, commitMsg });
  };

  process(ghContext: Context, dryRun: boolean): Promise<ProjectContext> {
    return ProjectOps.normalizeCommitMsg(this.gitParser.parse(ghContext))
      .then(runtime => this.buildContext(runtime, dryRun))
      .then(ctx => this.removeBranchIfNeed(ctx, dryRun));
  };

  private removeBranchIfNeed = async (context: ProjectContext, dryRun: boolean): Promise<ProjectContext> => {
    if (context.isPR && context.isMerged && !dryRun) {
      await GitOps.removeRemoteBranch(context.branch);
    }
    return context;
  };

  private async searchVersion(branch: string): Promise<VersionResult> {
    core.info(`Searching version in file...`);
    const r = await VersionPatternParser.search(this.projectConfig.versionStrategy.versionPatterns, branch);
    core.info(`Current Version: ${r.version}`);
    return r;
  }

  private async fixVersion(expectedVersion: string, dryRun: boolean): Promise<VersionResult> {
    core.info(`Fixing version to ${expectedVersion}...`);
    const r = await VersionPatternParser.replace(this.projectConfig.versionStrategy.versionPatterns, expectedVersion,
      dryRun);
    core.info(`Fixed ${r.files?.length} file(s): [${r.files}]`);
    return r;
  }

  private async buildContext(ctx: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    return core.group(`[CI::Process] Evaluate context on ${ctx.branch}`,
      () => ctx.isReleasePR || ctx.isTag
        ? this.buildContextWhenRelease(ctx, dryRun)
        : this.buildContextOnAnotherBranch(ctx, dryRun));
  }

  private async buildContextOnAnotherBranch(ctx: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    const vr = await this.searchVersion(ctx.branch);
    const needRun = ctx.isAfterMergedReleasePR;
    const versions: Versions = createVersions(ctx.versions, vr.version, needRun);
    const ci: CIContext = needRun ? await this.upgradeVersion(versions, dryRun) : { isPushed: false };
    return ({ ...ctx, version: versions.current, versions, ci, decision: ProjectOps.makeDecision(ctx, ci) });
  }

  private async buildContextWhenRelease(ctx: RuntimeContext, dryRun: boolean): Promise<ProjectContext> {
    let ci: CIContext = { isPushed: false };
    const vr = await this.fixVersion(ctx.versions.branch, dryRun);
    const versions: Versions = createVersions(ctx.versions, vr.version);
    const version = versions.current;
    if (vr.isChanged) {
      if (ctx.isTag) {
        throw `Git tag version doesn't meet with current version in files. Invalid files: [${vr.files}]`;
      }
      const commitVersionStatus = await this.gitOps.commitVersionCorrection(ctx.branch, version);
      const changelog = await this.generateChangelog(version, dryRun);

      if (commitVersionStatus.isCommitted || changelog.isCommitted) {
        ci = { ...(await this.gitOps.pushCommit({ ...commitVersionStatus }, dryRun)), changelog };
      }
    }
    if (ctx.isReleasePR && ctx.isMerged) {
      const tag = `${this.projectConfig.gitParserConfig.tagPrefix}${version}`;
      const status = await this.gitOps.tag(tag).then(s => this.gitOps.pushTag(tag, s, dryRun));
      ci = { ...status, needTag: true };
    }
    return { ...ctx, version, versions, ci, decision: ProjectOps.makeDecision(ctx, ci) };
  }

  private async upgradeVersion(versions: Versions, dryRun: boolean): Promise<CIContext> {
    const nextMode = this.projectConfig.versionStrategy.nextVersionMode;
    const nextVersion = getNextVersion(versions, nextMode);
    if (this.projectConfig.versionStrategy.nextVersionMode === 'NONE') {
      return { isPushed: false };
    }
    if (nextVersion === versions.current) {
      core.info('Current version and next version are same. Skip upgrade version');
      return { isPushed: false };
    }
    if (isEmpty(nextVersion)) {
      core.warning('Unknown next version. Skip upgrade version');
      return { isPushed: false };
    }
    const vr = await this.fixVersion(nextVersion!, dryRun);
    if (vr.isChanged) {
      const status = await this.gitOps.commitVersionUpgrade(nextVersion!).then(s => this.gitOps.pushCommit(s, dryRun));
      return { ...status, needUpgrade: true };
    }
    return { isPushed: false };
  }

  private async generateChangelog(version: string, dryRun: boolean): Promise<ChangelogResult> {
    return core.group(`[CHANGELOG] Generating CHANGELOG ${version}...`, async () => {
      const tagPrefix = this.projectConfig.gitParserConfig.tagPrefix;
      const latestTag = await GitOps.getLatestTag(tagPrefix);
      const result = await this.changelogOps.generate(latestTag, tagPrefix + version, dryRun);
      if (result.generated) {
        const { isPushed, ...status } = await this.gitOps.commit(result.commitMsg);
        return { ...result, ...status };
      }
      return { ...result, isCommitted: false };
    });
  }
}

