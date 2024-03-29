import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { createChangelogConfig } from './changelog';
import { createGitOpsConfig } from './gitOps';
import { createGitParserConfig } from './gitParser';
import { ProjectContext } from './projectContext';
import { ProjectOps } from './projectOps';
import { emptyOrElse, flatten, prettier } from './utils';
import { createVersionStrategy } from './versionStrategy';

const getInputBool = (inputName: string, _default: boolean = false): boolean => {
  const input = core.getInput(inputName);
  return !input ? _default : Boolean(JSON.parse(input));
};

const getInputString = (inputName: string, required: boolean = true): string => core.getInput(inputName, { required });

const getInputNumber = (inputName: string, required: boolean = true): number => +core.getInput(inputName, { required });

const setActionOutput = async (projectContext: ProjectContext) => {
  const { ci, decision, versions, version, ...rest } = projectContext;
  core.debug('Project context :::' + prettier(rest));
  if (versions) {
    await core.group('Version context', async () => core.info(prettier({ ...versions, version }, 'nope')));
  }
  if (ci) {
    await core.group('CI context', async () => core.info(prettier(ci)));
  }
  await core.group('CI decision', async () => core.info(prettier(decision, 'nope')));
  const outputs = flatten(projectContext);
  await core.group('Action Output', async () => core.info(prettier(outputs)));
  Object.keys(outputs).forEach(k => core.setOutput(k, outputs[k]));
};

const loadConfig: () => { dryRun: boolean; ops: ProjectOps } = () => {
  const token = getInputString('token', false);
  const gitParserConfig = createGitParserConfig(
    getInputString('defaultBranch'),
    getInputString('tagPrefix'),
    getInputString('hotfixPrefix'),
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
  const changelogConfig = createChangelogConfig(
    getInputBool('changelog', false),
    getInputString('changelogImage', false),
    getInputString('changelogConfigFile', false),
    emptyOrElse(getInputString('changelogToken', false), token),
    getInputString('changelogMsg', false));
  const dryRun = getInputBool('dry');
  const ops = new ProjectOps({ gitParserConfig, versionStrategy, gitOpsConfig, changelogConfig, token });
  return { dryRun, ops };
};

const run = async (ghContext: Context) => {
  return core.group('Loading Action configuration...', async () => loadConfig())
    .then(({ dryRun, ops }) => ops.process(ghContext, dryRun))
    .then(ghOutput => setActionOutput(ghOutput))
    .catch(error => core.setFailed(error));
};

run(github.context);
