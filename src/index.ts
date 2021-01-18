import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { GitContextInput, GitContextOps, GitContextOutput, GitInteractor, GitInteractorInput } from './git';
import { ProjectContextOps } from './project';

function getInputBool(inputName, required: boolean = true) {
  return Boolean(JSON.parse(core.getInput(inputName, { required })));
}

function getInputString(inputName, required: boolean = true) {
  return core.getInput(inputName, { required });
}

function interactGit(hasChanged: boolean, ghOutput: GitContextOutput,
                     interactorInput: GitInteractorInput): GitContextOutput | Promise<GitContextOutput> {
  if (ghOutput.isTag) {
    if (hasChanged) {
      throw `Git tag version doesn't meet with current version in files`;
    }
    return ghOutput;
  }
  if (ghOutput.isReleasePR && ghOutput.isMerged) {
    return { ...ghOutput, ci: { needTag: true, mustFixVersion: false, isPushed: false } };
  }
  return new GitInteractor(interactorInput).fixVersionThenCommitPush(ghOutput.version, hasChanged)
                                           .then(ci => ({ ...ghOutput, ci: ci }));
}

function process(context: Context, ghInput: GitContextInput, interactorInput: GitInteractorInput,
                 patterns: string, dryRun: boolean): Promise<GitContextOutput> {
  const ghOutput = new GitContextOps(ghInput).parse(context);
  return ProjectContextOps.create(patterns)
                          .validateThenReplace(ghOutput.version, dryRun)
                          .then(isChanged => interactGit(isChanged, ghOutput, interactorInput));
}

function addActionOutputs(ghOutput: GitContextOutput) {
  Object.keys(flatten(ghOutput, '-')).forEach(k => core.setOutput(k, ghOutput[k]));
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
                                                 getInputString('releaseVerMsg'));
  const patterns = getInputString('patterns', false);
  const dryRun = getInputBool('dry');
  process(context, ghInput, interactorInput, patterns, dryRun).then(ghOutput => addActionOutputs(ghOutput))
                                                              .catch(error => core.setFailed(error));

}

run(github.context);
