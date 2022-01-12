import { flatten } from '../src/utils';

test('flatten output', () => {
  const sample = JSON.parse('{\n' +
                            '  "branch": "release/1.0.1",\n' +
                            '  "onDefaultBranch": false,\n' +
                            '  "isPR": true,\n' +
                            '  "isReleasePR": true,\n' +
                            '  "isTag": false,\n' +
                            '  "isManualOrSchedule": false,\n' +
                            '  "isMerged": true,\n' +
                            '  "isClosed": false,\n' +
                            '  "version": "1.0.1",\n' +
                            '  "commitId": "6157d54403f7ad923e816e3c61b7366cb483ec35",\n' +
                            '  "isAfterMergedReleasePR": false,\n' +
                            '  "ci": {\n' +
                            '    "mustFixVersion": false,\n' +
                            '    "needTag": true,\n' +
                            '    "isPushed": true,\n' +
                            '    "commitMsg": "Release version v1.0.1",\n' +
                            '    "commitId": "6157d54"\n' +
                            '  }\n' +
                            '}');
  const output = flatten(sample);
  expect(output).toEqual({
                           branch: 'release/1.0.1',
                           onDefaultBranch: false,
                           isPR: true,
                           isReleasePR: true,
                           isTag: false,
                           isManualOrSchedule: false,
                           isMerged: true,
                           isClosed: false,
                           version: '1.0.1',
                           commitId: '6157d54403f7ad923e816e3c61b7366cb483ec35',
                           isAfterMergedReleasePR: false,
                           'ci_mustFixVersion': false,
                           'ci_needTag': true,
                           'ci_isPushed': true,
                           'ci_commitMsg': 'Release version v1.0.1',
                           'ci_commitId': '6157d54',
                         });
});
