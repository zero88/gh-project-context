const API_URL: string = 'https://api.github.com';
export const MOCK_OWNER: string = 'octocat';
export const MOCK_REPO: string = 'Hello-World';
export const MOCK_PR_URL: string = `${API_URL}/repos/${MOCK_OWNER}/${MOCK_REPO}/pulls`;

export const MOCK_LIST_PR: Array<object> = [
  {
    'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
    'id': 1,
    'node_id': 'MDExOlB1bGxSZXF1ZXN0MQ==',
    'html_url': 'https://github.com/octocat/Hello-World/pull/1347',
    'diff_url': 'https://github.com/octocat/Hello-World/pull/1347.diff',
    'patch_url': 'https://github.com/octocat/Hello-World/pull/1347.patch',
    'issue_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
    'commits_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
    'review_comments_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
    'review_comment_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}',
    'comments_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
    'statuses_url': 'https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'number': 1347,
    'state': 'open',
    'locked': true,
    'title': 'Amazing new feature',
    'body': 'Please pull these awesome changes in!',
    'labels': [
      {
        'id': 208045946,
        'node_id': 'MDU6TGFiZWwyMDgwNDU5NDY=',
        'url': 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
        'name': 'bug',
        'description': 'Something isn\'t working',
        'color': 'f29513',
        'default': true,
      },
    ],
    'active_lock_reason': 'too heated',
    'created_at': '2011-01-26T19:01:12Z',
    'updated_at': '2011-01-26T19:01:12Z',
    'closed_at': '2011-01-26T19:01:12Z',
    'merged_at': '2011-01-26T19:01:12Z',
    'merge_commit_sha': 'e5bd3914e2e596debea16f433f57875b5b90bcd6',
    'head': {
      'label': 'octocat:new-topic',
      'ref': 'new-topic',
      'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
    },
    'base': {
      'label': 'octocat:master',
      'ref': 'master',
      'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
    },
    '_links': {
      'self': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
      },
      'html': {
        'href': 'https://github.com/octocat/Hello-World/pull/1347',
      },
      'issue': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
      },
      'comments': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
      },
      'review_comments': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
      },
      'review_comment': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}',
      },
      'commits': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
      },
      'statuses': {
        'href': 'https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
    },
    'author_association': 'OWNER',
    'auto_merge': null,
    'draft': false,
  },
];
export const MOCK_CREATED_PR = {
  'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
  'id': 1,
  'node_id': 'MDExOlB1bGxSZXF1ZXN0MQ==',
  'html_url': 'https://github.com/octocat/Hello-World/pull/1347',
  'diff_url': 'https://github.com/octocat/Hello-World/pull/1347.diff',
  'patch_url': 'https://github.com/octocat/Hello-World/pull/1347.patch',
  'issue_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
  'commits_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
  'review_comments_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
  'review_comment_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}',
  'comments_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
  'statuses_url': 'https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e',
  'number': 1347,
  'state': 'open',
  'locked': true,
  'title': 'Amazing new feature',
  'body': 'Please pull these awesome changes in!',
  'labels': [
    {
      'id': 208045946,
      'node_id': 'MDU6TGFiZWwyMDgwNDU5NDY=',
      'url': 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
      'name': 'bug',
      'description': 'Something isn\'t working',
      'color': 'f29513',
      'default': true,
    },
  ],
  'active_lock_reason': 'too heated',
  'created_at': '2011-01-26T19:01:12Z',
  'updated_at': '2011-01-26T19:01:12Z',
  'closed_at': '2011-01-26T19:01:12Z',
  'merged_at': '2011-01-26T19:01:12Z',
  'merge_commit_sha': 'e5bd3914e2e596debea16f433f57875b5b90bcd6',
  'head': {
    'label': 'octocat:new-topic',
    'ref': 'new-topic',
    'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
  },
  'base': {
    'label': 'octocat:master',
    'ref': 'master',
    'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
  },
  '_links': {
    'self': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
    },
    'html': {
      'href': 'https://github.com/octocat/Hello-World/pull/1347',
    },
    'issue': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
    },
    'comments': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
    },
    'review_comments': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
    },
    'review_comment': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}',
    },
    'commits': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
    },
    'statuses': {
      'href': 'https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e',
    },
  },
  'author_association': 'OWNER',
  'auto_merge': null,
  'draft': false,
  'merged': false,
  'mergeable': true,
  'rebaseable': true,
  'mergeable_state': 'clean',
  'merged_by': {
    'login': 'octocat',
    'id': 1,
    'node_id': 'MDQ6VXNlcjE=',
    'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
    'gravatar_id': '',
    'url': 'https://api.github.com/users/octocat',
    'html_url': 'https://github.com/octocat',
    'followers_url': 'https://api.github.com/users/octocat/followers',
    'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
    'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
    'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
    'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
    'organizations_url': 'https://api.github.com/users/octocat/orgs',
    'repos_url': 'https://api.github.com/users/octocat/repos',
    'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
    'received_events_url': 'https://api.github.com/users/octocat/received_events',
    'type': 'User',
    'site_admin': false,
  },
  'comments': 10,
  'review_comments': 0,
  'maintainer_can_modify': true,
  'commits': 3,
  'additions': 100,
  'deletions': 3,
  'changed_files': 5,
};
