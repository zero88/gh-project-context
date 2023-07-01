import { isPullRequestAvailable, openPullRequest } from '../src/githubApi';
import { MOCK_CREATED_PR, MOCK_LIST_PR, MOCK_OWNER, MOCK_PR_URL, MOCK_REPO } from './mocks/githubApiMocks';
import { rest, server, waitForRequest } from './setup/mswServer';

test('get pull requests', async () => {
  server.use(rest.get(MOCK_PR_URL, (req, res, ctx) => res.once(ctx.json(MOCK_LIST_PR))));
  const pendingRequest = waitForRequest(MOCK_PR_URL, 'GET');
  const parameters = { base: 'main', head: 'release/1.0.11', owner: MOCK_OWNER, repo: MOCK_REPO };
  const isAvailable = await isPullRequestAvailable(parameters);
  const mockedRequest = await pendingRequest;
  expect(mockedRequest.url.pathname).toEqual('/repos/octocat/Hello-World/pulls');
  expect(mockedRequest.url.search)
    .toEqual('?head=octocat%3Arelease%2F1.0.11&base=main&state=open&sort=created&direction=desc&per_page=1&page=1');
  expect(isAvailable).toEqual(true);
});

test('open pull requests', async () => {
  server.use(
    rest.get(MOCK_PR_URL, (req, res, ctx) => res.once(ctx.json([]))),
    rest.post(MOCK_PR_URL, (req, res, ctx) => res.once(ctx.json(MOCK_CREATED_PR))),
  );
  const pendingRequest = waitForRequest(MOCK_PR_URL, 'POST');
  const parameters = {
    base: 'main',
    head: 'release/1.0.11',
    owner: MOCK_OWNER,
    repo: MOCK_REPO,
  };
  const isAvailable = await isPullRequestAvailable(parameters);
  expect(isAvailable).toEqual(false);
  const url = await openPullRequest({
    ...parameters,
    token: '0000000000000000000000000000000000000001',
  }, 'Release v1.0.11');
  const mockedRequest = await pendingRequest;
  expect(mockedRequest.method).toEqual('POST');
  expect(mockedRequest.url.pathname).toEqual('/repos/octocat/Hello-World/pulls');
  expect(mockedRequest.headers.get('authorization')).toEqual('token 0000000000000000000000000000000000000001');
  expect(await mockedRequest.json()).toEqual({
    head: 'octocat:release/1.0.11', base: 'main', title: 'Release v1.0.11',
  });
  expect(url).toEqual(`https://github.com/octocat/Hello-World/pull/1347`);
});
