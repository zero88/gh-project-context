import * as github from '@actions/github';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { Decision } from '../src/projectContext';
import { makeDecision } from '../src/projectOps';
import { runnerContext } from './mocks/githubRunnerMocks';
import * as onOpenBranchContext from './resources/github/@action.gh.branch.opened.json';
import * as onOpenedHotfixBranchContext from './resources/github/@action.gh.hotfix.branch.opened.json';
import * as onOpenedHotfixContext from './resources/github/@action.gh.hotfix.opened.json';
import * as onMergedHotfixPRContext from './resources/github/@action.gh.hotfix.pr.merged.json';
import * as onPushedHotfixPRContext from './resources/github/@action.gh.hotfix.pr.pushed.json';
import * as onOpenedHotfixReleaseBranchCtx from './resources/github/@action.gh.hotfix.release.branch.opened.json';
import * as onOpenedHotfixReleasePRContext from './resources/github/@action.gh.hotfix.release.pr.opened.json';
import * as onPushedHotfixAfterMergeReleaseCtx from './resources/github/@action.gh.hotfix.push.after.mergeRelease.json';
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

test.each`
  label                               | context                             | expected
  ${`On Push On default branch`}      | ${onPushedOnDefaultContext}           | ${{ build: true, publish: true }}
  ${`On Open normal branch`}          | ${onOpenBranchContext}                | ${{ build: false, publish: false }}
  ${`On Open normal Pull Request`}    | ${onOpenedPRContext}                  | ${{ build: true, publish: false }}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}                  | ${{ build: false, publish: false }}
  ${`On Create On release branch`}    | ${onOpenedReleaseBranchContext}       | ${{ build: false, publish: false }}
  ${`On Push On release branch`}      | ${onPushedReleaseBranchContext}       | ${{ build: false, publish: false }}
  ${`On Open Release Pull Request`}   | ${onOpenedReleasePRContext}           | ${{ build: true, publish: false }}
  ${`On Merge Release Pull Request`}  | ${onMergedReleasePRContext}           | ${{ build: false, publish: false }}
  ${`On Close Release Pull Request`}  | ${onClosedReleasePRContext}           | ${{ build: false, publish: false }}
  ${`On Push After merged release`}   | ${onPushedAfterMergeReleaseContext}   | ${{ build: false, publish: false }}
  ${`On Tag`}                         | ${onTagContext}                       | ${{ build: true, publish: true }}
  ${`On Open hotfix base branch`}     | ${onOpenedHotfixContext}              | ${{ build: false, publish: false }}
  ${`On Open hotfix fixed branch`}    | ${onOpenedHotfixBranchContext}        | ${{ build: false, publish: false }}
  ${`On Push hotfix Pull Request`}    | ${onPushedHotfixPRContext}            | ${{ build: true, publish: false }}
  ${`On Merge hotfix fixed PR`}       | ${onMergedHotfixPRContext}            | ${{ build: false, publish: false }}
  ${`On Open hotfix release branch`}  | ${onOpenedHotfixReleaseBranchCtx}     | ${{ build: false, publish: false }}
  ${`On Open hotfix release PR`}      | ${onOpenedHotfixReleasePRContext}     | ${{ build: true, publish: false }}
  ${`On Push hotfix After merged`}    | ${onPushedHotfixAfterMergeReleaseCtx} | ${{ build: false, publish: false }}
`(`Decision [$label]`, ({ context, expected }: { context: string, expected: Decision }) => {
  runnerContext.mock(context);
  const runtimeContext = new GitParser(createGitParserConfig()).parse(github.context);

  expect(makeDecision(runtimeContext, false)).toEqual(expected);
});
