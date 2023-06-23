import * as core from '@actions/core';
import { CIContextOnMergeReleasePR, CIContextOnNext, CIContextOnReleaseBranch, Versions } from './projectContext';
import { RuntimeContext, RuntimeVersions } from './runtimeContext';
import { isEmpty } from './utils';
import { VersionPatternParser } from './versionPatternParser';
import { createVersions, getNextVersion, VersionResult, VersionStrategy } from './versionStrategy';

type HasVersion = { versions: Versions }
export type FixedResult = HasVersion & Omit<CIContextOnReleaseBranch, 'changelog'> & CIContextOnMergeReleasePR;
export type UpgradeResult = HasVersion & CIContextOnNext & { nextVersion?: string }

export class ReleaseVersionOps {

  private readonly versionStrategy: VersionStrategy;

  constructor(versionStrategy: VersionStrategy) {
    this.versionStrategy = versionStrategy;
  }

  async fix(ctx: RuntimeContext, dryRun: boolean): Promise<FixedResult> {
    return core.group(`[Version] Fixing release version...`, async () => this.doFix(ctx, dryRun));
  }

  async upgrade(ctx: RuntimeContext, shouldBumpVersion: boolean, dryRun: boolean): Promise<UpgradeResult> {
    return core.group(`[Version] Upgrading next version...`,
      async () => this.doUpgrade(ctx.branch, ctx.versions, shouldBumpVersion, dryRun));
  }

  private async doFix(ctx: RuntimeContext, dryRun: boolean): Promise<FixedResult> {
    const { files, isChanged, version: fixedVersion } = await this.fixVersion(ctx.versions.branch, dryRun);
    const versions: Versions = createVersions(ctx.versions, fixedVersion);
    if (isChanged && ctx.isTag) {
      throw `Git tag version doesn't meet with current version in files. Invalid files: [${files}]`;
    }
    if (isChanged && ctx.isMerged) {
      throw `Merge too soon, not yet fixed version. Invalid files: [${files}]`;
    }
    return { needTag: ctx.isMerged, needPullRequest: ctx.isReleaseBranch, mustFixVersion: isChanged, versions };
  }

  private async doUpgrade(branch: string, runtimeVersions: RuntimeVersions, shouldBumpVersion: boolean, dryRun: boolean): Promise<UpgradeResult> {
    const versionInConf = await this.searchVersion(branch);
    const versions: Versions = createVersions(runtimeVersions, versionInConf, shouldBumpVersion);
    if (!shouldBumpVersion) {
      return { needUpgrade: false, versions };
    }
    const nextMode = this.versionStrategy.nextVersionMode;
    const nextVersion = getNextVersion(versions, nextMode);
    if (nextMode === 'NONE') {
      return { needUpgrade: false, versions };
    }
    if (isEmpty(nextVersion)) {
      core.warning('Unknown next version. Skip upgrade version');
      return { needUpgrade: false, versions };
    }
    if (nextVersion === versions.current) {
      core.info('Current version and next version are same. Skip upgrade version');
      return { needUpgrade: false, versions };
    }
    const vr = await this.fixVersion(nextVersion!, dryRun);
    return { needUpgrade: vr.isChanged, versions, nextVersion };
  }

  private async searchVersion(branch: string): Promise<string> {
    core.info(`Searching version in file...`);
    const r = await VersionPatternParser.search(this.versionStrategy.versionPatterns, branch);
    core.info(`Current Version: ${r.version}`);
    return r.version;
  }

  private async fixVersion(expectedVersion: string, dryRun: boolean): Promise<VersionResult> {
    core.info(`Fixing version to ${expectedVersion}...`);
    const r = await VersionPatternParser.replace(this.versionStrategy.versionPatterns, expectedVersion, dryRun);
    core.info(`Fixed ${r.files?.length} file(s): [${r.files}]`);
    return r;
  }
}