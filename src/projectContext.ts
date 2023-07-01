import { ChangelogResult } from './changelog';
import { CommitPushStatus } from './gitOps';
import { RuntimeContext, RuntimeVersion } from './runtimeContext';
import { NextVersion } from './versionStrategy';

export interface Decision {
  /**
   * Should run the next step: such as build & test
   * <p>
   * Default value is `!output.ci.isPushed && !output.isClosed && !output.isMerged && !output.isAfterMergedReleasePR && !output.isReleaseBranch`
   */
  readonly build: boolean;
  /**
   * Should publish artifact: such as push artifact to any registry: npm, docker, maven, pypi, etc...
   * <p>
   * Default value is `output.decision.build && (output.onDefaultBranch || output.isTag)`
   */
  readonly publish: boolean;
}

export interface CIContextOnRelease {
  /**
   * Need to fix version to match with release name
   */
  readonly mustFixVersion: boolean;
}

export interface CIContextOnReleaseBranch extends CIContextOnRelease {
  /**
   * Need to create new pull request
   */
  readonly needPullRequest: boolean;

  /**
   * CI changelog result
   */
  readonly changelog: ChangelogResult;
}

export interface CIContextOnMergeReleasePR extends CIContextOnRelease {
  /**
   * Need to tag new version if release branch is merged
   */
  readonly needTag: boolean;

}

export interface CIContextOnNext {
  /**
   * Need to upgrade next version after release branch is merged
   */
  readonly needUpgrade: boolean;

}

export type CIContextOnEvent = CIContextOnReleaseBranch | CIContextOnMergeReleasePR | CIContextOnNext;

export type CIContext = CommitPushStatus & CIContextOnEvent

export interface Versions extends RuntimeVersion, NextVersion {
  /**
   * Current version in configuration file or tag/release version
   */
  readonly current: string;
}

export interface ProjectContext extends RuntimeContext {
  /**
   * Current version
   * @type {string}
   */
  readonly version: string;
  /**
   * Version output
   */
  readonly versions: Versions;
  /**
   * CI context
   */
  readonly ci: CIContext;
  /**
   * Decision output
   */
  readonly decision: Decision;
}
