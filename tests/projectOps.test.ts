import * as github from '@actions/github';
import { createGitParserConfig, GitParser } from '../src/gitParser';
import { Decision } from '../src/projectContext';
import { makeDecision } from '../src/projectOps';
import { runnerContext } from './mocks/githubRunnerMocks';
import * as onCreateBranchContext from './resources/github/@action.gh.branch.create.json';
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

test.each`
  label                               | context                           | expected
  ${`On Push On default branch`}      | ${onPushOnDefaultContext}         | ${{ build: true, publish: true }}
  ${`On Create normal branch`}        | ${onCreateBranchContext}          | ${{ build: false, publish: false }}
  ${`On Open normal Pull Request`}    | ${onOpenPRContext}                | ${{ build: true, publish: false }}
  ${`On Merge normal Pull Request`}   | ${onMergedPRContext}              | ${{ build: false, publish: false }}
  ${`On Create On release branch`}    | ${onCreateReleaseBranchContext}   | ${{ build: false, publish: false }}
  ${`On Push On release branch`}      | ${onPushReleaseBranchContext}     | ${{ build: false, publish: false }}
  ${`On Open Release Pull Request`}   | ${onOpenReleasePRContext}         | ${{ build: true, publish: false }}
  ${`On Merge Release Pull Request`}  | ${onMergeReleasePRContext}        | ${{ build: false, publish: false }}
  ${`On Close Release Pull Request`}  | ${onCloseReleasePRContext}        | ${{ build: false, publish: false }}
  ${`On Push After merged release`}   | ${onPushAfterMergeReleaseContext} | ${{ build: false, publish: false }}
  ${`On Tag`}                         | ${onTagContext}                   | ${{ build: true, publish: true }}
`(`Decision [$label]`, ({ context, expected }: { context: string, expected: Decision }) => {
  runnerContext.mock(context);
  const runtimeContext = new GitParser(createGitParserConfig()).parse(github.context);

  expect(makeDecision(runtimeContext, false)).toEqual(expected);
});
