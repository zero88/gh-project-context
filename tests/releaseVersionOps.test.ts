import * as github from '@actions/github';
import { describe } from 'node:test';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { FixedResult, ReleaseVersionOps, UpgradeResult } from '../src/releaseVersionOps';
import { RuntimeContext } from '../src/runtimeContext';
import { createVersionStrategy } from '../src/versionStrategy';
import { runnerContext } from './mocks/githubRunnerMocks';
import * as onPushedHotfixAfterMergeReleaseCtx from './resources/github/@action.gh.hotfix.push.after.mergeRelease.json';
import * as onPushAfterMergeReleaseContext from './resources/github/@action.gh.push.after.mergeRelease.json';
import * as onOpenReleaseBranchContext from './resources/github/@action.gh.release.branch.opened.json';
import * as onPushReleaseBranchContext from './resources/github/@action.gh.release.branch.pushed.json';
import * as onCloseReleasePRContext from './resources/github/@action.gh.release.pr.closed.json';
import * as onMergeReleasePRContext from './resources/github/@action.gh.release.pr.merged.json';
import * as onOpenReleasePRContext from './resources/github/@action.gh.release.pr.opened.json';
import * as onTagContext from './resources/github/@action.gh.tag.json';

const expectedCreateOnReleaseBranch: FixedResult = {
  mustFixVersion: true,
  needPullRequest: true,
  needTag: false,
  versions: {
    branch: '1.0.12',
    current: '1.0.12',
  },
};

const expectedPushOnReleaseBranch: FixedResult = {
  mustFixVersion: true,
  needPullRequest: true,
  needTag: false,
  versions: {
    branch: '1.0.11',
    current: '1.0.11',
  },
};

const expectedOnClosedReleasePR = {
  mustFixVersion: true,
  needPullRequest: false,
  needTag: false,
  versions: {
    branch: '1.0.0',
    current: '1.0.0',
  },
};
const expectedOpenReleasePR = {
  mustFixVersion: true,
  needPullRequest: false,
  needTag: false,
  versions: {
    branch: '1.0.6',
    current: '1.0.6',
  },
};
const expectedOnMergedReleasePR = {};
const expectedOnTag = {};
const expectedOnPushAfterMergeReleasePR: UpgradeResult = {
  needUpgrade: true,
  versions: {
    branch: 'main',
    current: '0.1.0',
    nextMajor: '1.0.0',
    nextMinor: '0.2.0',
    nextPath: '0.1.1',
    bumped: '0.2.0',
  },
};
const expectedOnPushHotfixAfterMergeReleasePR: UpgradeResult = {
  needUpgrade: false,
  versions: {
    branch: 'hotfix/1.0.17',
    current: '0.1.0'
  },
};

const mockVersionStrategy = createVersionStrategy(`./tests/resources/project/default/package.json`, 'MINOR');

describe(`Fix version on release with changes`, () => {

  test.each`
  label                               | context                           | expected
  ${`On Create On release branch`}    | ${onOpenReleaseBranchContext}     | ${expectedCreateOnReleaseBranch}
  ${`On Push On release branch`}      | ${onPushReleaseBranchContext}     | ${expectedPushOnReleaseBranch}
  ${`On Close Release Pull Request`}  | ${onCloseReleasePRContext}        | ${expectedOnClosedReleasePR}
  ${`On Open Release Pull Request`}   | ${onOpenReleasePRContext}         | ${expectedOpenReleasePR}
`(`Should success when fixing version with file changes [$label]`,
    async ({ context, expected }: { context: string, expected: RuntimeContext }) => {
      runnerContext.mock(context);
      const runtimeContext = new GitParser(createGitParserConfig()).parse(github.context);
      const versionOps = new ReleaseVersionOps(mockVersionStrategy);
      expect(await versionOps.fix(runtimeContext, true)).toStrictEqual(expected);
    });

  test.each([
    {
      label: `On Merge Release Pull Request`,
      context: onMergeReleasePRContext,
      expected: `Merge too soon, not yet fixed version. Invalid files: [./tests/resources/project/default/package.json]`,
    },
    {
      label: `On Tag`,
      context: onTagContext,
      expected: `Git tag version doesn't meet with current version in files. Invalid files: [./tests/resources/project/default/package.json]`,
    },
  ])(`Should throw error when fixing version with file changes [$label]`,
    async ({ context, expected }) => {
      runnerContext.mock(context);
      const runtimeContext = new GitParser(createGitParserConfig()).parse(github.context);
      const versionOps = new ReleaseVersionOps(mockVersionStrategy);
      await expect(async () => versionOps.fix(runtimeContext, true)).rejects.toEqual(expected);
    });
});

describe(`Upgrade version after release`, () => {

  test.each`
  label                                    | context                               | expected
  ${`On Push After merged release`}        | ${onPushAfterMergeReleaseContext}     | ${expectedOnPushAfterMergeReleasePR}
  ${`On Push Hotfix After merged release`} | ${onPushedHotfixAfterMergeReleaseCtx} | ${expectedOnPushHotfixAfterMergeReleasePR}
`(`Upgrade version [$label]`,
    async ({ context, expected }: { context: string, expected: RuntimeContext }) => {
      runnerContext.mock(context);
      const runtimeContext = new GitParser(createGitParserConfig()).parse(github.context);
      const versionOps = new ReleaseVersionOps(mockVersionStrategy);
      expect(await versionOps.upgrade(runtimeContext, true)).toStrictEqual(expected);
    });
});
