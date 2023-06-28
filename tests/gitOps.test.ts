import { CommitStatus, mergeCommitStatus } from '../src/gitOps';

test.each([
  {
    status1: { isCommitted: false },
    status2: { isCommitted: false },
    expected: { isCommitted: false, commitMsg: undefined, commitId: undefined },
  },
  {
    status1: { isCommitted: false },
    status2: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
    expected: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
  },
  {
    status1: { isCommitted: false, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
    status2: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
    expected: { isCommitted: true, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
  },
  {
    status1: { isCommitted: true, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
    status2: { isCommitted: false },
    expected: { isCommitted: true, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
  },
  {
    status1: {},
    status2: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
    expected: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
  },
  {
    status1: { isCommitted: true, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
    status2: { isCommitted: true, commitMsg: 'hello', commitId: 'd2ecc0f95d081b511b076c7522631eab2b321538' },
    expected: { isCommitted: true, commitMsg: 'hey', commitId: '0b9f17952f04c4bc8df983c5509671e9419ca1bb' },
  },
])('merged commit status', (args) => {
  expect(mergeCommitStatus(<CommitStatus>args.status1, <CommitStatus>args.status2)).toStrictEqual(args.expected);
});
