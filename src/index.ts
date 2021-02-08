import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { GitContextInput, GitContextOps, GitInteractorInput } from './git';
import { GitContextOutput } from './output';
import { ProjectContextOps } from './project';
import { flatten } from './utils';

function getInputBool(inputName: string, required: boolean = true): boolean {
  return Boolean(JSON.parse(core.getInput(inputName, { required })));
}

function getInputString(inputName: string, required: boolean = true): string {
  return core.getInput(inputName, { required });
}

function getInputNumber(inputName: string, required: boolean = true): number {
  return +core.getInput(inputName, { required });
}

function process(context: Context, ghInput: GitContextInput, interactorInput: GitInteractorInput,
                 patterns: string, dryRun: boolean): Promise<GitContextOutput> {
  const ops = ProjectContextOps.create(ghInput, interactorInput, patterns);
  const ghOutput = new GitContextOps(ghInput).parse(context);
  return ops.fixOrSearchVersion(ghOutput, dryRun)
            .then(r => ops.ciStep(r, ghOutput, dryRun))
            .then(output => ({ ...output, decision: ops.makeDecision(output) }))
            .then(output => ({ ...output, ver: ops.nextVersion(output) }))
            .then(output => ops.tweakVersion(output));
}

function addActionOutputs(ghOutput: GitContextOutput) {
  const outputs = flatten(ghOutput);
  core.info(`===================`);
  core.info(`Context output: ${JSON.stringify(outputs, undefined, 2)}`);
  Object.keys(outputs).forEach(k => core.setOutput(k, outputs[k]));
}

function run(context: Context) {
  core.debug(`The event payload: ${JSON.stringify(context, undefined, 2)}`);
  const ghInput = new GitContextInput(getInputString('defaultBranch'),
                                      getInputString('tagPrefix'),
                                      getInputString('releaseBranchPrefix'),
                                      getInputString('mergedReleaseMsgRegex'),
                                      getInputNumber('shaLength'));
  const interactorInput = new GitInteractorInput(getInputBool('allowCommit'),
                                                 getInputBool('allowTag'),
                                                 getInputString('prefixCiMsg'),
                                                 getInputString('correctVerMsg'),
                                                 getInputString('releaseVerMsg'),
                                                 getInputString('userName'),
                                                 getInputString('userEmail'),
                                                 getInputBool('mustSign'));
  const patterns = getInputString('patterns', false);
  const dryRun = getInputBool('dry');
  process(context, ghInput, interactorInput, patterns, dryRun).then(ghOutput => addActionOutputs(ghOutput))
                                                              .catch(error => core.setFailed(error));
}

run(github.context);
