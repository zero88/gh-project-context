import { readEnv } from './exec';

interface GithubRunnerEnv {
  workspace: string,
  fqnRepo: string,
  owner: string,
  repo: string,
  apiUrl: string,
  webUrl: string,
}

const load = (): GithubRunnerEnv => {
  const owner = readEnv('GITHUB_REPOSITORY_OWNER');
  const fqnRepo = readEnv('GITHUB_REPOSITORY');
  return {
    workspace: readEnv('GITHUB_WORKSPACE'),
    fqnRepo: fqnRepo,
    owner: owner,
    repo: fqnRepo.replace(owner + '/', ''),
    apiUrl: readEnv('GITHUB_REPOSITORY_OWNER'),
    webUrl: readEnv('GITHUB_REPOSITORY_OWNER'),
  };
};

const RUNNER_ENV = Object.freeze(load());

export { GithubRunnerEnv, RUNNER_ENV };
