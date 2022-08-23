import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { createChangelogConfig } from './changelog';
import { createGitOpsConfig } from './gitOps';
import { createGitParserConfig } from './gitParser';
import { ProjectContext } from './projectContext';
import { ProjectOps } from './projectOps';
import { flatten } from './utils';
import { createVersionStrategy } from './versionStrategy';

const getInputBool = (inputName: string, _default: boolean = false): boolean => {
  const input = core.getInput(inputName);
  return !input ? _default : Boolean(JSON.parse(input));
};

const getInputString = (inputName: string, required: boolean = true): string => core.getInput(inputName, { required });

const getInputNumber = (inputName: string, required: boolean = true): number => +core.getInput(inputName, { required });

const setActionOutput = async (projectContext: ProjectContext) => {
  const { ci, decision, versions, version, ...rest } = projectContext;
  await core.group('Project context', async () => core.info(JSON.stringify(rest, Object.keys(rest).sort(), 2)));
  if (versions) {
    await core.group('Version context', async () => core.info(JSON.stringify({ ...versions, version }, undefined, 2)));
  }
  if (ci) {
    await core.group('CI context', async () => core.info(JSON.stringify(ci, Object.keys(ci).sort(), 2)));
  }
  await core.group('CI decision', async () => core.info(JSON.stringify(decision, undefined, 2)));
  const outputs = flatten(projectContext);
  await core.group('Action Output', async () => core.info(JSON.stringify(outputs, Object.keys(outputs).sort(), 2)));
  Object.keys(outputs).forEach(k => core.setOutput(k, outputs[k]));
};

const run = (ghContext: Context) => {
  core.debug(`The GitHub context: ${JSON.stringify(ghContext, undefined, 2)}`);
  const gitParserConfig = createGitParserConfig(
    getInputString('defaultBranch'),
    getInputString('tagPrefix'),
    getInputString('releaseBranchPrefix'),
    getInputString('mergedReleaseMsgRegex'),
    getInputNumber('shaLength'));
  const versionStrategy = createVersionStrategy(getInputString('patterns', false), getInputString('nextVerMode'));
  const gitOpsConfig = createGitOpsConfig(
    getInputBool('allowCommit', true),
    getInputBool('allowTag', true),
    getInputString('prefixCiMsg'),
    getInputString('correctVerMsg'),
    getInputString('releaseVerMsg'),
    getInputString('userName'),
    getInputString('userEmail'),
    getInputBool('mustSign'),
    getInputString('nextVerMsg'));
  const dryRun = getInputBool('dry');
  const changelogConfig = createChangelogConfig(
    getInputBool('changelog', false),
    getInputString('changelogImageTag', false),
    getInputString('changelogConfigFile', false),
    getInputString('changelogToken', false),
    getInputString('changelogMsg', false));
  const ops = new ProjectOps({ gitParserConfig, versionStrategy, gitOpsConfig, changelogConfig });
  core.group('Processing...', () => ops.process(ghContext, dryRun))
    .then(ghOutput => setActionOutput(ghOutput))
    .catch(error => core.setFailed(error));
};

run(github.context);
