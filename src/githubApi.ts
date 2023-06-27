import * as core from '@actions/core';
import { request } from '@octokit/request';
import { RUNNER_ENV } from './githubRunner';
import { isEmpty, isNotEmpty } from './utils';

const DEFAULT_HEADERS: Record<string, string> = {
  accept: 'application/vnd.github+json',
};

interface PullRequestParameter {
  baseUrl?: string,
  owner?: string,
  repo?: string,
  head: string,
  base: string,
  token?: string
}

const createHeaders = (token?: string): {} => {
  let headers = DEFAULT_HEADERS;
  if (isNotEmpty(token)) {
    headers = { ...headers, authorization: `token ${token}` };
  }
  return { headers: Object.freeze(headers) };
};

const getBaseUrl = (baseUrl: string | undefined) => {
  const _baseUrl = baseUrl ?? RUNNER_ENV.apiUrl;
  return isEmpty(_baseUrl) ? {} : { baseUrl: _baseUrl };
};

const getPullRequests = async (parameters: PullRequestParameter) => {
  const owner = parameters.owner ?? RUNNER_ENV.owner;
  return request('GET /repos/{owner}/{repo}/pulls', {
    ...createHeaders(parameters.token),
    ...getBaseUrl(parameters.baseUrl),
    owner: owner,
    repo: parameters.repo ?? RUNNER_ENV.repo,
    head: `${owner}:${parameters.head}`,
    base: parameters.base,
    state: 'open',
    sort: 'created',
    direction: 'desc',
    per_page: 1,
    page: 1,
  }).then(resp => resp.data).catch(err => core.warning(JSON.stringify(err)));
};

const isPullRequestAvailable = async (parameters: PullRequestParameter): Promise<boolean> =>
  getPullRequests(parameters).then(pr => {
    core.debug(JSON.stringify(pr));
    return isNotEmpty(pr);
  });

const openPullRequest = async (parameters: PullRequestParameter, title: string): Promise<void> => {
  const owner = parameters.owner ?? RUNNER_ENV.owner;
  const options = {
    ...createHeaders(parameters.token),
    ...getBaseUrl(parameters.baseUrl),
    owner: owner,
    repo: parameters.repo ?? RUNNER_ENV.repo,
    head: `${owner}:${parameters.head}`,
    base: parameters.base,
    title,
  };
  return request('POST /repos/{owner}/{repo}/pulls', options)
    .then(resp => core.debug(JSON.stringify(resp.data)))
    .catch(err => core.error('Cannot open PR: ' + JSON.stringify(err)));
};

export { PullRequestParameter, getPullRequests, isPullRequestAvailable, openPullRequest };
