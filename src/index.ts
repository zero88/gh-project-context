import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitContextInput, GitContextOps } from './git';
import { parsePatterns } from './project';

try {
  const ghInput = new GitContextInput(core.getInput('defaultBranch', { required: true }),
                                      core.getInput('tagPrefix', { required: true }),
                                      core.getInput('releaseBranchPrefix', { required: true }),
                                      core.getInput('mergedReleaseMsgRegex', { required: true }));
  const projectInput = parsePatterns(core.getInput('patterns', { required: true }));
  console.log(`The event payload: ${JSON.stringify(github.context, undefined, 2)}`);
  const ghOutput = new GitContextOps(ghInput).parse(github.context);
  console.log(`Context output: ${JSON.stringify(ghOutput, undefined, 2)}`);
  Object.keys(ghOutput).forEach(k => core.setOutput(k, ghOutput[k]));
} catch (error) {
  core.setFailed(error);
}
