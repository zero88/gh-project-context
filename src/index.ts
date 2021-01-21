import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { GitContextInput, GitContextOps, GitContextOutput, GitInteractor, GitInteractorInput } from './git';
import { ProjectContextOps, VersionResult } from './project';
import { flatten } from './utils';

function getInputBool(inputName, required: boolean = true) {
  return Boolean(JSON.parse(core.getInput(inputName, { required })));
}

function getInputString(inputName, required: boolean = true) {
  return core.getInput(inputName, { required });
}

function doCIStep(versionResult: VersionResult, ghOutput: GitContextOutput, interactor: GitInteractor,
                  dryRun: boolean): GitContextOutput | Promise<GitContextOutput> {
  if (ghOutput.isTag && versionResult.isChanged) {
    throw `Git tag version doesn't meet with current version in files. Invalid files: [${versionResult.files}]`;
  }
  if (ghOutput.isTag || ghOutput.isAfterMergedReleasePR) {
    return ghOutput;
  }
  if (ghOutput.isReleasePR && ghOutput.isMerged) {
    core.info(`Tag new version ${ghOutput.version}...`);
    return interactor.tagThenPush(ghOutput.version, ghOutput.isMerged, dryRun)
                     .then(ci => ({ ...ghOutput, ci: ci }));
  }
  core.info(`Fixing version ${ghOutput.version}...`);
  return interactor.fixVersionThenCommitPush(ghOutput.branch, ghOutput.version, versionResult, dryRun)
                   .then(ci => ({ ...ghOutput, ci: ci }));
}

function makeDecision(output: GitContextOutput) {
  const shouldBuild = !output.isClosed && !output.ci?.isPushed;
  const shouldPublish = shouldBuild && (output.onDefaultBranch || output.isTag);
  return { ...output, decision: { shouldBuild, shouldPublish } };
}

function process(context: Context, ghInput: GitContextInput, interactorInput: GitInteractorInput,
                 patterns: string, dryRun: boolean): Promise<GitContextOutput> {
  const ghOutput = new GitContextOps(ghInput).parse(context);
  const interactor = new GitInteractor(interactorInput, ghInput);
  return ProjectContextOps.create(patterns)
                          .validateThenReplace(ghOutput.version, dryRun)
                          .then(r => doCIStep(r, ghOutput, interactor, dryRun))
                          .then(output => makeDecision(output));
}

function addActionOutputs(ghOutput: GitContextOutput) {
  Object.keys(flatten(ghOutput)).forEach(k => core.setOutput(k, ghOutput[k]));
  core.info(`===================`);
  core.info(`Context output: ${JSON.stringify(ghOutput, undefined, 2)}`);
}

function run(context: Context) {
  core.debug(`The event payload: ${JSON.stringify(context, undefined, 2)}`);
  const ghInput = new GitContextInput(getInputString('defaultBranch'),
                                      getInputString('tagPrefix'),
                                      getInputString('releaseBranchPrefix'),
                                      getInputString('mergedReleaseMsgRegex'));
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
