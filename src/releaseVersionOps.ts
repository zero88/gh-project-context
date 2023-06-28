import * as core from '@actions/core';
import { CIContextOnMergeReleasePR, CIContextOnNext, CIContextOnReleaseBranch, Versions } from './projectContext';
import { RuntimeContext } from './runtimeContext';
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
    return core.group(`[Version] Fixing release version in project manifest...`, async () => this.doFix(ctx, dryRun));
  }

  async upgrade(ctx: RuntimeContext, shouldBumpVersion: boolean, dryRun: boolean): Promise<UpgradeResult> {
    const versions: Versions = await core.group(`[Version] Evaluating version in project manifest...`,
      async () => this.searchVersion(ctx.branch).then(v => createVersions(ctx.versions, v, shouldBumpVersion)));
    if (!shouldBumpVersion) {
      return { needUpgrade: false, versions };
    }
    return core.group(`[Version] Upgrading next version...`, async () => this.doUpgrade(versions, dryRun));
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

  private async doUpgrade(versions: Versions, dryRun: boolean): Promise<UpgradeResult> {
    const nextMode = this.versionStrategy.nextVersionMode;
    const nextVersion = getNextVersion(versions, nextMode);
    if (nextMode === 'NONE') {
      core.info('[Version] None strategy to upgrade version. Skip to upgrade version.');
      return { needUpgrade: false, versions };
    }
    if (isEmpty(nextVersion)) {
      core.warning('[Version] Unknown next version. Skip to upgrade version.');
      return { needUpgrade: false, versions };
    }
    if (nextVersion === versions.current) {
      core.info('[Version] Current version and next version are same. Skip to upgrade version.');
      return { needUpgrade: false, versions };
    }
    const vr = await this.fixVersion(nextVersion!, dryRun);
    return { needUpgrade: vr.isChanged, versions, nextVersion };
  }

  private async searchVersion(branch: string): Promise<string> {
    const r = await VersionPatternParser.search(this.versionStrategy.versionPatterns, branch);
    core.info(`[Version] Current Version: ${r.version}`);
    return r.version;
  }

  private async fixVersion(expectedVersion: string, dryRun: boolean): Promise<VersionResult> {
    core.info(`[Version] Fixing version to ${expectedVersion}...`);
    const r = await VersionPatternParser.replace(this.versionStrategy.versionPatterns, expectedVersion, dryRun);
    core.info(`[Version] Fixed ${r.files?.length} file(s): [${r.files}]`);
    return r;
  }
}
