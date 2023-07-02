import { createVersionStrategy, DEFAULT_PATTERNS, findPreviousVersion } from '../src/versionStrategy';

test('parse_empty', () => expect(createVersionStrategy('').versionPatterns.length).toEqual(0));

test('parse_in_default_folder', () => {
  const patterns = DEFAULT_PATTERNS
    .split(/\r?\n/)
    .map(v => `./tests/**/default/${v.trim()}`).join(`\n`);
  console.log(patterns);
  const { versionPatterns } = createVersionStrategy(patterns);
  console.log(versionPatterns);
  expect(versionPatterns.length).toEqual(5);
  expect(versionPatterns.find(i => i.ext === '.toml')?.files?.length).toEqual(1);
  expect(versionPatterns.find(i => i.ext === '.json')?.files?.length).toEqual(2);
  expect(versionPatterns.find(i => i.ext === '.yml')?.files?.length).toEqual(2);
  expect(versionPatterns.find(i => i.ext === '.properties')?.files?.length).toEqual(4);
  expect(versionPatterns.find(i => i.ext === '.txt')?.files?.length).toEqual(2);
});

test('parse_in_project_folder', () => {
  const patterns = `./tests/**/project/*.json,
    ./tests/**/project/*.properties
    ./tests/**/project/*.toml,./tests/**/project/*.txt
    ./tests/**/project/*.yaml
    ./tests/**/project/*.yml`;
  const { versionPatterns } = createVersionStrategy(patterns);
  console.log(versionPatterns);
  expect(versionPatterns.length).toEqual(5);
  expect(versionPatterns.find(i => i.ext === '.toml')?.files?.length).toEqual(1);
  expect(versionPatterns.find(i => i.ext === '.json')?.files?.length).toEqual(1);
  expect(versionPatterns.find(i => i.ext === '.yml')?.files?.length).toEqual(1);
  expect(versionPatterns.find(i => i.ext === '.properties')?.files?.length).toEqual(1);
  expect(versionPatterns.find(i => i.ext === '.txt')?.files?.length).toEqual(1);
});

test('parse_without_default', () => {
  const patterns = `./tests/**/project/**/version.py::(PI_VERSION\s?=\s?)(')([^']+)(')::2`;
  const inputs = createVersionStrategy(patterns);
  expect(inputs.versionPatterns.length).toEqual(1);
  expect(inputs.versionPatterns[0].ext).toEqual('.py');
  expect(inputs.versionPatterns[0].group).toEqual(2);
  expect(inputs.versionPatterns[0].pattern).toEqual(new RegExp('(PI_VERSIONs?=s?)(\')([^\']+)(\')'));
});

test.each([
  { current: '1.0.1', versions: ['1.0.2', '1.0.0', '1.0.0-pre.1'], expected: '1.0.0' },
  { current: '1.0.0', versions: ['1.0.2', '1.0.0', '1.0.0-pre.1'], expected: '1.0.0-pre.1' },
  { current: '1.0.1+hf.1', versions: ['1.0.2', '1.0.1', '1.0.0'], expected: '1.0.1' },
  { current: '1.0.1+hotfix.1', versions: ['1.0.2', '1.0.1', '1.0.0'], expected: '1.0.1' },
  { current: '1.0.1+hf.2', versions: ['1.0.2', '1.0.1+hf.1', '1.0.1', '1.0.0'], expected: '1.0.1+hf.1' },
  { current: '1.0.1+hotfix.2', versions: ['1.0.2', '1.0.1+hotfix.1', '1.0.0'], expected: '1.0.1+hotfix.1' },
  { current: '1.0.1+hf.20230703', versions: ['1.0.2', '1.0.1', '1.0.0'], expected: '1.0.1' },
  { current: '1.0.1+hf.20230703', versions: ['1.0.2', '1.0.1+hf.1', '1.0.1', '1.0.0'], expected: '1.0.1+hf.1' },
  { current: '1.0.1+hf.not.is.number', versions: ['1.0.2', '1.0.1', '1.0.0'], expected: '1.0.1' },
])('find_previous_version of $current => $expected', (args) => {
  const prevVersion = findPreviousVersion(args.current, args.versions);
  expect(prevVersion).toEqual(args.expected);
});
