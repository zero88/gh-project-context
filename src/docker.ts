import * as core from '@actions/core';
import { ExecResult, strictExec } from './exec';
import { arrayToObjectWithVal, isNull } from './utils';

export class DockerRunCLI {
  static DEFAULT_WORKDIR = '/github/workspace';

  static envs = (envs?: Record<string, any>): string[] => {
    const def = ['CI', 'GITHUB_API_URL', 'GITHUB_SERVER_URL', 'GITHUB_WORKSPACE'];
    const environments = { ...arrayToObjectWithVal(def, () => null), ...(envs ?? {}) };
    const toEnv = kv => isNull(kv[1]) ? kv[0] : `${kv[0]}=${kv[1]}`;
    return Object.entries(environments).map(toEnv).map(e => ['-e', e]).flat();
  };

  static volumes = (volumes?: Record<string, any>): string[] => {
    const toVolume = kv => isNull(kv[1]) ? kv[0] : `${kv[0]}:${kv[1]}`;
    return Object.entries(volumes ?? {}).map(toVolume).map(v => ['-v', v]).flat();
  };

  static execute = (image: string, containerCmd?: Array<string>, envs?: Record<string, any>,
    volumes?: Record<string, any>): Promise<ExecResult> => {
    const args = [
      'run', '-t', '--rm',
      '--workdir', DockerRunCLI.DEFAULT_WORKDIR,
      ...DockerRunCLI.envs(envs),
      ...DockerRunCLI.volumes(volumes),
      image,
      ...(containerCmd ?? []),
    ];
    core.debug(`Docker run args: ${args}`);
    return strictExec('docker', args, 'Unable to run docker', false);
  };
}
