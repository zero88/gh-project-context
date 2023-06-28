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

const expectedOnPushOnDefault = {
  'branch': 'main',
  'commitId': '008bb233ec5e5fa057044d6dd3f522e8b28703af',
  'commitMsg': 'Update Dockerfile to check cache',
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleaseBranch': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': true,
  'shortCommitId': '008bb23',
  'versions': {
    'branch': 'main',
  },
};

const expectedPushOnReleaseBranch = {
  'branch': 'release/1.0.11',
  'commitId': 'ceba909e616c57a0593961813ad6d43f3196ce54',
  'commitMsg': 'update test workflow',
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleaseBranch': true,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': 'ceba909',
  'versions': {
    'branch': '1.0.11',
  },
};


const expectedCreateOnReleaseBranch = {
  'branch': 'release/1.0.12',
  'commitId': 'bcc2dd741f4ed103317d53454f7271c5a555b446',
  "commitMsg": undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleaseBranch': true,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': 'bcc2dd7',
  'versions': {
    'branch': '1.0.12',
  },
};

const expectedOpenPR = {
  'branch': 'octocat-patch-1',
  'commitId': '7f028a79fe6be749688bea353ebddebca2c893be',
  'commitMsg': undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleaseBranch': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '7f028a7',
  'versions': {
    'branch': 'octocat-patch-1',
  },
};

const expectedMergedPR = {
  'branch': 'octocat-patch-1',
  'commitId': '7321f38bfa2a36649f6d38012b28166653588f93',
  'commitMsg': undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': true,
  'isPR': true,
  'isReleaseBranch': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '7321f38',
  'versions': {
    'branch': 'octocat-patch-1',
  },
};

const expectedOnClosedReleasePR = {
  'branch': 'release/1.0.0',
  'commitId': '956a75767722d596de58fa277cce281529c5272d',
  'commitMsg': undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': true,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleaseBranch': false,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '956a757',
  'versions': {
    'branch': '1.0.0',
  },
};

const expectedOpenReleasePR = {
  'branch': 'release/1.0.6',
  'commitId': '99064653320ede50bd20437dd4c61d5719ca12f4',
  'commitMsg': undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleaseBranch': false,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '9906465',
  'versions': {
    'branch': '1.0.6',
  },
};

const expectedOnMergedReleasePR = {
  'branch': 'release/1.0.6',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': undefined,
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': true,
  'isPR': true,
  'isReleaseBranch': false,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '1584df0',
  'versions': {
    'branch': '1.0.6',
  },
};

const expectedOnPushAfterMergeReleasePR = {
  'branch': 'main',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': 'Merge pull request #16 from octocat/release/1.0.6\n\nUpdate README.md',
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': true,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleaseBranch': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': true,
  'shortCommitId': '1584df0',
  'versions': {
    'branch': 'main',
  },
};
const expectedOnTag = {
  'branch': 'v1.0.6',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': 'Merge pull request #16 from octocat/release/1.0.6\n\nUpdate README.md',
  'defaultBranch': 'main',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleaseBranch': false,
  'isReleasePR': false,
  'isTag': true,
  'onDefaultBranch': false,
  'shortCommitId': '1584df0',
  'versions': {
    'branch': '1.0.6',
  },
};

test.each`
  label                               | context                           | expected
  ${`On Push On default branch`}      | ${onPushOnDefaultContext}         | ${expectedOnPushOnDefault}
  ${`On Open normal Pull Request`}    | ${onOpenPRContext}                | ${expectedOpenPR}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}              | ${expectedMergedPR}
  ${`On Create On release branch`}    | ${onCreateReleaseBranchContext}   | ${expectedCreateOnReleaseBranch}
  ${`On Push On release branch`}      | ${onPushReleaseBranchContext}     | ${expectedPushOnReleaseBranch}
  ${`On Close Release Pull Request`}  | ${onCloseReleasePRContext}        | ${expectedOnClosedReleasePR}
  ${`On Open Release Pull Request`}   | ${onOpenReleasePRContext}         | ${expectedOpenReleasePR}
  ${`On Merge Release Pull Request`}  | ${onMergeReleasePRContext}        | ${expectedOnMergedReleasePR}
  ${`On Push After merged release`}   | ${onPushAfterMergeReleaseContext} | ${expectedOnPushAfterMergeReleasePR}
  ${`On Tag`}                         | ${onTagContext}                   | ${expectedOnTag}
`(`parse [$label]`, ({ context, expected }: { context: string, expected: RuntimeContext }) => {
  runnerContext.mock(context);
  expect(new GitParser(createGitParserConfig()).parse(github.context)).toStrictEqual(expected);
});
