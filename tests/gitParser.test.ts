import * as github from '@actions/github';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { RuntimeContext } from '../src/runtimeContext';
import { isNotEmpty } from '../src/utils';
import { runnerContext } from './mocks/githubRunnerMocks';
import * as onOpenBranchContext from './resources/github/@action.gh.branch.opened.json';
import * as onOpenedHotfixBranchContext from './resources/github/@action.gh.hotfix.branch.opened.json';
import * as onOpenedHotfixContext from './resources/github/@action.gh.hotfix.opened.json';
import * as onMergedHotfixPRContext from './resources/github/@action.gh.hotfix.pr.merged.json';
import * as onPushedHotfixPRContext from './resources/github/@action.gh.hotfix.pr.pushed.json';
import * as onPushedHotfixAfterMergeReleaseCtx from './resources/github/@action.gh.hotfix.push.after.mergeRelease.json';
import * as onOpenedHotfixReleaseBranchCtx from './resources/github/@action.gh.hotfix.release.branch.opened.json';
import * as onOpenedHotfixReleasePRContext from './resources/github/@action.gh.hotfix.release.pr.opened.json';
import * as onMergedPRContext from './resources/github/@action.gh.pr.merged.json';
import * as onOpenedPRContext from './resources/github/@action.gh.pr.opened.json';
import * as onPushedAfterMergeReleaseContext from './resources/github/@action.gh.push.after.mergeRelease.json';
import * as onPushedOnDefaultContext from './resources/github/@action.gh.push.json';
import * as onOpenedReleaseBranchContext from './resources/github/@action.gh.release.branch.opened.json';
import * as onPushedReleaseBranchContext from './resources/github/@action.gh.release.branch.pushed.json';
import * as onClosedReleasePRContext from './resources/github/@action.gh.release.pr.closed.json';
import * as onMergedReleasePRContext from './resources/github/@action.gh.release.pr.merged.json';
import * as onOpenedReleasePRContext from './resources/github/@action.gh.release.pr.opened.json';
import * as onTagContext from './resources/github/@action.gh.tag.json';

test.each([
  `Merge pull request #3 from octocat/release/1.0.1

  Try`,
  `Merge pull request #38 from octocat/release/hotfix/1.0.17

  Release hotfix 1.0.17`,
])(
  'merged release message regex', (msg) => {
    const regex = createGitParserConfig().mergedReleaseMsgRegex;
    console.log(msg, regex);
    expect(isNotEmpty(msg.match(regex))).toBeTruthy();
  });

const expectedOnPushedOnDefault: RuntimeContext = {
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: 'main',
  },
};

const expectedOnOpenedNormalPR: Partial<RuntimeContext> = {
  branch: 'octocat-patch-1',
  prBaseBranch: 'main',
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: 'octocat-patch-1',
  },
};

const expectedOnOpenedBranch: Partial<RuntimeContext> = {
  branch: 'octocat-patch-1',
  commitId: '8a280afa14917b8c832b7cdfab7c703c6fcab936',
  commitShortId: '8a280af',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: false,
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
  prBaseBranch: 'main',
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: true,
  isOpened: false,
  versions: {
    branch: 'octocat-patch-1',
  },
};

const expectedOnPushedReleaseBranch: RuntimeContext = {
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.11',
  },
};

const expectedOnOpenedReleaseBranch: Partial<RuntimeContext> = {
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
  isHotfix: false,
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
  prBaseBranch: 'main',
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: true,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.0',
  },
};

const expectedOnOpenedReleasePR: Partial<RuntimeContext> = {
  branch: 'release/1.0.6',
  prBaseBranch: 'main',
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
  isHotfix: false,
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
  prBaseBranch: 'main',
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: true,
  isOpened: false,
  versions: {
    branch: '1.0.6',
  },
};

const expectedOnPushedAfterMergeReleasePR: Partial<RuntimeContext> = {
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
  isHotfix: false,
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
  isHotfix: false,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: '1.0.6',
  },
};
const expectedOnOpenedHotfixBaseBranch: Partial<RuntimeContext> = {
  branch: 'hotfix/1.0.17',
  commitId: 'fb826899bf7e77f0bb05e759591f35ce9e3b2961',
  commitShortId: 'fb82689',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: 'hotfix/1.0.17',
  },
};
const expectedOnOpenedHotfixFixedBranch: Partial<RuntimeContext> = {
  branch: 'hotfix/bugfix/fix-issue1',
  commitId: 'cefab7a504b2c5919f0573b68dee707694d32e62',
  commitShortId: 'cefab7a',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: 'hotfix/bugfix/fix-issue1',
  },
};
const expectedOnPushedHotfixPR: Partial<RuntimeContext> = {
  branch: 'hotfix/bugfix/fix-issue1',
  prBaseBranch: 'hotfix/1.0.17',
  commitId: 'a3e6a82a164c3f91f5c54a279eb4b48b8de99d8a',
  commitShortId: 'a3e6a82',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: 'hotfix/bugfix/fix-issue1',
  },
};
const expectedOnMergedHotfixPR: Partial<RuntimeContext> = {
  branch: 'hotfix/bugfix/fix-issue1',
  prBaseBranch: 'hotfix/1.0.17',
  commitId: 'a8eedc40ef4f6058f6b4bb6cc2ef4b649a1e9638',
  commitShortId: 'a8eedc4',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: true,
  isOpened: false,
  versions: {
    branch: 'hotfix/bugfix/fix-issue1',
  },
};
const expectedOnOpenedHotfixReleaseBranch: Partial<RuntimeContext> = {
  branch: 'release/hotfix/1.0.17',
  commitId: '4b6c8b86c7e66cd58b545e4c1416bf219ba9d1ca',
  commitShortId: '4b6c8b8',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: '1.0.17',
  },
};
const expectedOnOpenedHotfixReleasePR: Partial<RuntimeContext> = {
  branch: 'release/hotfix/1.0.17',
  prBaseBranch: 'hotfix/1.0.17',
  commitId: 'eb42830f8a6aeb6bb3ff30632db01cb69b05f292',
  commitShortId: 'eb42830',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: false,
  isPR: true,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: true,
  isHotfix: true,
  isAfterMergedReleasePR: false,
  isClosed: false,
  isMerged: false,
  isOpened: true,
  versions: {
    branch: '1.0.17',
  },
};
const expectedOnPushedHotfixAfterMergedRelease: Partial<RuntimeContext> = {
  branch: 'hotfix/1.0.17',
  commitId: '1bfef9f2168ac3b1db6974c56d31f5350c805f97',
  commitShortId: '1bfef9f',
  commitMsg: 'Merge pull request #38 from octocat/release/hotfix/1.0.17\n\nRelease hotfix 1.0.17',
  defaultBranch: 'main',
  onDefaultBranch: false,
  isBranch: true,
  isPR: false,
  isTag: false,
  isDispatch: false,
  isSchedule: false,
  isRelease: false,
  isHotfix: true,
  isAfterMergedReleasePR: true,
  isClosed: false,
  isMerged: false,
  isOpened: false,
  versions: {
    branch: 'hotfix/1.0.17',
  },
};

test.each`
  label                               | context                               | expected
  ${`On Push On default branch`}      | ${onPushedOnDefaultContext}           | ${expectedOnPushedOnDefault}
  ${`On Open normal Branch`}          | ${onOpenBranchContext}                | ${expectedOnOpenedBranch}
  ${`On Open normal Pull Request`}    | ${onOpenedPRContext}                  | ${expectedOnOpenedNormalPR}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}                  | ${expectedOnMergedNormalPR}
  ${`On Create On release branch`}    | ${onOpenedReleaseBranchContext}       | ${expectedOnOpenedReleaseBranch}
  ${`On Push On release branch`}      | ${onPushedReleaseBranchContext}       | ${expectedOnPushedReleaseBranch}
  ${`On Open Release Pull Request`}   | ${onOpenedReleasePRContext}           | ${expectedOnOpenedReleasePR}
  ${`On Merge Release Pull Request`}  | ${onMergedReleasePRContext}           | ${expectedOnMergedReleasePR}
  ${`On Close Release Pull Request`}  | ${onClosedReleasePRContext}           | ${expectedOnClosedReleasePR}
  ${`On Push After merged release`}   | ${onPushedAfterMergeReleaseContext}   | ${expectedOnPushedAfterMergeReleasePR}
  ${`On Tag`}                         | ${onTagContext}                       | ${expectedOnTag}
  ${`On Open hotfix base branch`}     | ${onOpenedHotfixContext}              | ${expectedOnOpenedHotfixBaseBranch}
  ${`On Open hotfix fixed branch`}    | ${onOpenedHotfixBranchContext}        | ${expectedOnOpenedHotfixFixedBranch}
  ${`On Push hotfix Pull Request`}    | ${onPushedHotfixPRContext}            | ${expectedOnPushedHotfixPR}
  ${`On Merge hotfix fixed PR`}       | ${onMergedHotfixPRContext}            | ${expectedOnMergedHotfixPR}
  ${`On Open hotfix release branch`}  | ${onOpenedHotfixReleaseBranchCtx}     | ${expectedOnOpenedHotfixReleaseBranch}
  ${`On Open hotfix release PR`}      | ${onOpenedHotfixReleasePRContext}     | ${expectedOnOpenedHotfixReleasePR}
  ${`On Push hotfix after merged`}    | ${onPushedHotfixAfterMergeReleaseCtx} | ${expectedOnPushedHotfixAfterMergedRelease}
`(`parse [$label]`, ({ context, expected }: { context: string, expected: RuntimeContext }) => {
  runnerContext.mock(context);
  expect(new GitParser(createGitParserConfig()).parse(github.context)).toEqual(expected);
});
