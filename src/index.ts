import * as core from '@actions/core';
import * as github from '@actions/github'
import { GitContextInput, GitContextOps } from './git';

try {
  const projectType = core.getInput('projectType', { required: true });
  const ctxInput = new GitContextInput(core.getInput('defaultBranch', { required: true }),
                                       core.getInput('tagPrefix', { required: true }),
                                       core.getInput('releaseBranchPrefix', { required: true }),
                                       core.getInput('mergedReleaseMsgRegex', { required: true }));
  console.log(`Hello ${projectType}!`);
  console.log(`The event payload: ${JSON.stringify(github.context, undefined, 2)}`);
  const ctxOut = new GitContextOps(ctxInput).parse();
  console.log(`Context output: ${JSON.stringify(ctxOut, undefined, 2)}`);
  Object.keys(ctxOut).forEach(k => core.setOutput(k, ctxOut[k]));
} catch (error) {
  core.setFailed(error.message);
}
