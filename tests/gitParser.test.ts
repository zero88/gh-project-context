import * as github from '@actions/github';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { RuntimeContext } from '../src/runtimeContext';
import { runnerContext } from './mocks/githubRunnerMocks';
import * as onMergedPRContext from './resources/github/@action.gh.pr.merged.json';
import * as onOpenPRContext from './resources/github/@action.gh.pr.open.json';
import * as onPushAfterMergeReleaseContext from './resources/github/@action.gh.push.after.mergeRelease.json';
import * as onPushOnDefaultContext from './resources/github/@action.gh.push.json';
import * as onCreateReleaseBranchContext from './resources/github/@action.gh.release.branch.create.json';
import * as onPushReleaseBranchContext from './resources/github/@action.gh.release.branch.push.json';
import * as onCloseReleasePRContext from './resources/github/@action.gh.release.pr.closed.json';
import * as onMergeReleasePRContext from './resources/github/@action.gh.release.pr.merged.json';
import * as onOpenReleasePRContext from './resources/github/@action.gh.release.pr.open.json';
import * as onTagContext from './resources/github/@action.gh.tag.json';

test('merged release message regex', () => {
  const regex = createGitParserConfig().mergedReleaseMsgRegex;
  console.log(regex);
  expect(regex.test(`Merge pull request #3 from octocat/release/1.0.1
  
  Try`)).toBeTruthy();
});

const expectedOnPushOnDefault: RuntimeContext = {
  branch: 'main',
  commitId: '008bb233ec5e5fa057044d6dd3f522e8b28703af',
  commitShortId: '008bb23',
  commitMsg: 'Update Dockerfile to check cache',
  defaultBranch: 'main',
  onDefaultBranch: true,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: 'main',
  },
};

const expectedOnOpenNormalPR: Partial<RuntimeContext> = {
  branch: 'octocat-patch-1',
  commitId: '7f028a79fe6be749688bea353ebddebca2c893be',
  commitShortId: '7f028a7',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: 'octocat-patch-1',
  },
};

const expectedOnMergedNormalPR: Partial<RuntimeContext> = {
  branch: 'octocat-patch-1',
  commitId: '7321f38bfa2a36649f6d38012b28166653588f93',
  commitShortId: '7321f38',
  commitMsg: undefined,
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: true,
  isOpened: false,
  versions: {
    branch: 'octocat-patch-1',
  },
};

const expectedOnPushReleaseBranch: RuntimeContext = {
  branch: 'release/1.0.11',
  commitId: 'ceba909e616c57a0593961813ad6d43f3196ce54',
  commitShortId: 'ceba909',
  commitMsg: 'update test workflow',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.11',
  },
};

const expectedOnCreateReleaseBranch: Partial<RuntimeContext> = {
  branch: 'release/1.0.12',
  commitId: 'bcc2dd741f4ed103317d53454f7271c5a555b446',
  commitShortId: 'bcc2dd7',
  commitMsg: undefined,
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: '1.0.12',
  },
};

const expectedOnClosedReleasePR: Partial<RuntimeContext> = {
  branch: 'release/1.0.0',
  commitId: '956a75767722d596de58fa277cce281529c5272d',
  commitShortId: '956a757',
  commitMsg: undefined,
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: true,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.0',
  },
};

const expectedOnOpenReleasePR: Partial<RuntimeContext> = {
  branch: 'release/1.0.6',
  commitId: '99064653320ede50bd20437dd4c61d5719ca12f4',
  commitShortId: '9906465',
  commitMsg: undefined,
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: '1.0.6',
  },
};

const expectedOnMergedReleasePR: Partial<RuntimeContext> = {
  branch: 'release/1.0.6',
  commitId: '1584df028b7f4c1d87327da577c2d465f147134f',
  commitShortId: '1584df0',
  commitMsg: undefined,
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: true,
  isOpened: false,
  versions: {
    branch: '1.0.6',
  },
};

const expectedOnPushAfterMergeReleasePR: Partial<RuntimeContext> = {
  branch: 'main',
  commitId: '1584df028b7f4c1d87327da577c2d465f147134f',
  commitShortId: '1584df0',
  commitMsg: 'Merge pull request #16 from octocat/release/1.0.6\n\nUpdate README.md',
  defaultBranch: 'main',
  onDefaultBranch: true,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isAfterMergedReleasePR: true,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: 'main',
  },
};
const expectedOnTag: RuntimeContext = {
  branch: 'v1.0.6',
  commitId: '1584df028b7f4c1d87327da577c2d465f147134f',
  commitShortId: '1584df0',
  commitMsg: 'Merge pull request #16 from octocat/release/1.0.6\n\nUpdate README.md',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: false,
  isTag: true,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.6',
  },
};

test.each`
  label                               | context                           | expected
  ${`On Push On default branch`}      | ${onPushOnDefaultContext}         | ${expectedOnPushOnDefault}
  ${`On Open normal Pull Request`}    | ${onOpenPRContext}                | ${expectedOnOpenNormalPR}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}              | ${expectedOnMergedNormalPR}
  ${`On Create On release branch`}    | ${onCreateReleaseBranchContext}   | ${expectedOnCreateReleaseBranch}
  ${`On Push On release branch`}      | ${onPushReleaseBranchContext}     | ${expectedOnPushReleaseBranch}
  ${`On Open Release Pull Request`}   | ${onOpenReleasePRContext}         | ${expectedOnOpenReleasePR}
  ${`On Merge Release Pull Request`}  | ${onMergeReleasePRContext}        | ${expectedOnMergedReleasePR}
  ${`On Close Release Pull Request`}  | ${onCloseReleasePRContext}        | ${expectedOnClosedReleasePR}
  ${`On Push After merged release`}   | ${onPushAfterMergeReleaseContext} | ${expectedOnPushAfterMergeReleasePR}
  ${`On Tag`}                         | ${onTagContext}                   | ${expectedOnTag}
`(`parse [$label]`, ({ context, expected }: { context: string, expected: RuntimeContext }) => {
  runnerContext.mock(context);
  expect(new GitParser(createGitParserConfig()).parse(github.context)).toEqual(expected);
});
