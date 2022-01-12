import * as github from '@actions/github';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { RuntimeContext } from '../src/runtimeContext';
import * as onMergedPRContext from './resources/github/@action.gh.pr.merged.json';
import * as onOpenPRContext from './resources/github/@action.gh.pr.open.json';
import * as onPushAfterMergeReleaseContext from './resources/github/@action.gh.push.after.mergeRelease.json';
import * as onPushOnDefaultContext from './resources/github/@action.gh.push.json';
import * as onCloseReleasePRContext from './resources/github/@action.gh.release.pr.closed.json';
import * as onMergeReleasePRContext from './resources/github/@action.gh.release.pr.merged.json';
import * as onOpenReleasePRContext from './resources/github/@action.gh.release.pr.open.json';
import * as onTagContext from './resources/github/@action.gh.tag.json';

const originalContext = { ...github.context };

afterEach(() => Object.defineProperty(github, 'context', { value: originalContext }));

test('merged release message regex', () => {
  const regex = createGitParserConfig().mergedReleaseMsgRegex;
  console.log(regex);
  expect(regex.test(`Merge pull request #3 from zero88/release/1.0.1
  
  Try`)).toBeTruthy();
});

const expectedOnPush = {
  'branch': 'main',
  'commitId': '008bb233ec5e5fa057044d6dd3f522e8b28703af',
  'commitMsg': 'Update Dockerfile to check cache',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': true,
  'shortCommitId': '008bb233',
  'versions': {
    'branch': 'main',
  },
};

const expectedOpenPR = {
  'branch': 'zero88-patch-1',
  'commitId': '7f028a79fe6be749688bea353ebddebca2c893be',
  'commitMsg': undefined,
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '7f028a79',
  'versions': {
    'branch': 'zero88-patch-1',
  },
};

const expectedMergedPR = {
  'branch': 'zero88-patch-1',
  'commitId': '7321f38bfa2a36649f6d38012b28166653588f93',
  'commitMsg': undefined,
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': true,
  'isPR': true,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '7321f38b',
  'versions': {
    'branch': 'zero88-patch-1',
  },
};

const expectedOnClosedReleasePR = {
  'branch': 'release/1.0.0',
  'commitId': '956a75767722d596de58fa277cce281529c5272d',
  'commitMsg': undefined,
  'isAfterMergedReleasePR': false,
  'isClosed': true,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '956a7576',
  'versions': {
    'branch': '1.0.0',
  },
};

const expectedOpenReleasePR = {
  'branch': 'release/1.0.6',
  'commitId': '99064653320ede50bd20437dd4c61d5719ca12f4',
  'commitMsg': undefined,
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': true,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '99064653',
  'versions': {
    'branch': '1.0.6',
  },
};

const expectedOnMergedReleasePR = {
  'branch': 'release/1.0.6',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': undefined,
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': true,
  'isPR': true,
  'isReleasePR': true,
  'isTag': false,
  'onDefaultBranch': false,
  'shortCommitId': '1584df02',
  'versions': {
    'branch': '1.0.6',
  },
};

const expectedOnPushAfterMergeReleasePR = {
  'branch': 'main',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': 'Merge pull request #16 from zero88/release/1.0.6\n\nUpdate README.md',
  'isAfterMergedReleasePR': true,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleasePR': false,
  'isTag': false,
  'onDefaultBranch': true,
  'shortCommitId': '1584df02',
  'versions': {
    'branch': 'main',
  },
};
const expectedOnTag = {
  'branch': 'v1.0.6',
  'commitId': '1584df028b7f4c1d87327da577c2d465f147134f',
  'commitMsg': 'Merge pull request #16 from zero88/release/1.0.6\n\nUpdate README.md',
  'isAfterMergedReleasePR': false,
  'isClosed': false,
  'isManualOrSchedule': false,
  'isMerged': false,
  'isPR': false,
  'isReleasePR': false,
  'isTag': true,
  'onDefaultBranch': false,
  'shortCommitId': '1584df02',
  'versions': {
    'branch': '1.0.6',
  },
};

test.each`
  label                               | file                              | expected
  ${`On Push On default branch`}      | ${onPushOnDefaultContext}         | ${expectedOnPush}
  ${`On Open normal Pull Request`}    | ${onOpenPRContext}                | ${expectedOpenPR}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}              | ${expectedMergedPR}
  ${`On Close Release Pull Request`}  | ${onCloseReleasePRContext}        | ${expectedOnClosedReleasePR}
  ${`On Open Release Pull Request`}   | ${onOpenReleasePRContext}         | ${expectedOpenReleasePR}
  ${`On Merge Release Pull Request`}  | ${onMergeReleasePRContext}        | ${expectedOnMergedReleasePR}
  ${`On Push After merged release`}   | ${onPushAfterMergeReleaseContext} | ${expectedOnPushAfterMergeReleasePR}
  ${`On Tag`}                         | ${onTagContext}                   | ${expectedOnTag}
`(`parse [$label]`, ({ file, expected }: { file: string, expected: RuntimeContext }) => {
  Object.defineProperty(github, 'context', { value: file });
  const runtime = new GitParser(createGitParserConfig()).parse(github.context);
  console.log(runtime);
  expect(runtime).toStrictEqual(expected);
});
