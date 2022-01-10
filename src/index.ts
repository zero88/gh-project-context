import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { GitContextInput, GitContextOps, GitInteractorInput } from './git';
import { GitContextOutput } from './output';
import { ProjectContextOps } from './project';
import { flatten } from './utils';

function getInputBool(inputName: string, _default: boolean = false): boolean {
  let input = core.getInput(inputName);
  return !input ? _default : Boolean(JSON.parse(input));
}

function getInputString(inputName: string, _required: boolean = true): string {
  return core.getInput(inputName, { required: _required });
}

function getInputNumber(inputName: string, _required: boolean = true): number {
  return +core.getInput(inputName, { required: _required });
}

function process(context: Context, ghInput: GitContextInput, interactorInput: GitInteractorInput,
  patterns: string, dryRun: boolean): Promise<GitContextOutput> {
  const ops = ProjectContextOps.create(ghInput, interactorInput, patterns);
  const ghOutput = new GitContextOps(ghInput).parse(context);
  return ops.fixOrSearchVersion(ghOutput, dryRun)
    .then(r => ops.checkCommitMsg(ghOutput).then(output => ops.ciStep(r, output, dryRun)))
    .then(output => ({ ...output, decision: ops.makeDecision(output) }))
    .then(output => ({ ...output, ver: ops.nextVersion(output) }))
    .then(output => ops.tweakVersion(output))
    .then(output => ops.removeBranchIfNeed(output))
    .then(output => ops.upgradeVersion(output));
}

async function addActionOutputs(ghOutput: GitContextOutput) {
  const { ci, decision, ver, version, ...rest } = ghOutput;
  await core.group('Project context', async () => core.info(JSON.stringify(rest, Object.keys(rest).sort(), 2)));
  if (ver) {
    await core.group('Version context', async () => core.info(JSON.stringify({ ...ver, version }, undefined, 2)));
  }
  if (ci) {
    await core.group('CI context', async () => core.info(JSON.stringify(ci, Object.keys(ci).sort(), 2)));
  }
  await core.group('CI decision', async () => core.info(JSON.stringify(decision, undefined, 2)));
  const outputs = flatten(ghOutput);
  await core.group('Action Output', async () => core.info(JSON.stringify(outputs, Object.keys(outputs).sort(), 2)));
  Object.keys(outputs).forEach(k => core.setOutput(k, outputs[k]));
}

function run(context: Context) {
  core.debug(`The event payload: ${JSON.stringify(context, undefined, 2)}`);
  const ghInput = new GitContextInput(getInputString('defaultBranch'),
    getInputString('tagPrefix'),
    getInputString('releaseBranchPrefix'),
    getInputString('mergedReleaseMsgRegex'),
    getInputNumber('shaLength'));
  const interactorInput = new GitInteractorInput(getInputBool('allowCommit', true),
    getInputBool('allowTag', true),
    getInputString('prefixCiMsg'),
    getInputString('correctVerMsg'),
    getInputString('releaseVerMsg'),
    getInputString('userName'),
    getInputString('userEmail'),
    getInputBool('mustSign'),
    getInputString('nextVerMsg'),
    getInputString('nextVerMode'));
  const patterns = getInputString('patterns', false);
  const dryRun = getInputBool('dry');
  core.group('Processing...', () => process(context, ghInput, interactorInput, patterns, dryRun))
    .then(ghOutput => addActionOutputs(ghOutput))
    .catch(error => core.setFailed(error));
}

run(github.context);
