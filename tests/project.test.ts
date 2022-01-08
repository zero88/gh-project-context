import { FileVersionParser, ProjectContextOps } from '../src/project';

function test_version_parser(patterns: string, current: string, next: string, expected: string) {
  const inputs = ProjectContextOps.parse(patterns);
  expect(inputs.length).toEqual(1);
  expect(inputs[0].pattern.test(current)).toBeTruthy();
  expect(FileVersionParser.replaceMatch(next, current, inputs[0].pattern, inputs[0].group)).toEqual(expected);
}

describe('Parser', () => {
  test('parse_empty', () => expect(ProjectContextOps.parse('').length).toEqual(0));

  test('parse_default', () => {
    const patterns = ProjectContextOps.DEFAULT_PATTERNS
      .split(/\r?\n/)
      .map(v => `./tests/**/default/${v.trim()}`).join(`\n`);
    console.log(patterns);
    const inputs = ProjectContextOps.parse(patterns);
    expect(inputs.length).toEqual(5);
    expect(inputs.find(i => i.ext === '.toml')?.files?.length).toEqual(1);
    expect(inputs.find(i => i.ext === '.json')?.files?.length).toEqual(2);
    expect(inputs.find(i => i.ext === '.yml')?.files?.length).toEqual(2);
    expect(inputs.find(i => i.ext === '.properties')?.files?.length).toEqual(4);
    expect(inputs.find(i => i.ext === '.txt')?.files?.length).toEqual(2);
  });

  test('parse_customize', () => {
    const patterns = `./tests/**/project/*.json,
    ./tests/**/project/*.properties
    ./tests/**/project/*.toml,./tests/**/project/*.txt
    ./tests/**/project/*.yaml
    ./tests/**/project/*.yml`;
    const inputs = ProjectContextOps.parse(patterns);
    console.log(inputs);
    expect(inputs.length).toEqual(5);
  });

  test('parse_without_default', () => {
    const patterns = `./tests/**/project/**/version.py::(PI_VERSION\s?=\s?)(')([^']+)(')::2`;
    const inputs = ProjectContextOps.parse(patterns);
    expect(inputs.length).toEqual(1);
    expect(inputs[0].ext).toEqual('.py');
    expect(inputs[0].group).toEqual(2);
    expect(inputs[0].pattern).toEqual(new RegExp('(PI_VERSIONs?=s?)(\')([^\']+)(\')'));
  });

  test.each([
    ['"version":"1.0.0"', '1.0.0', '"version":"1.0.0"'],
    ['"version": "1.0.0"', '1.0.0', '"version": "1.0.0"'],
    ['"version" : "1.0.0"', '1.0.0', '"version" : "1.0.0"'],
    ['"version":"2.0.0"', '2.0.1', '"version":"2.0.1"'],
    ['"version": "2.0.0"', '2.0.1', '"version": "2.0.1"'],
    ['"version" : "2.0.0"', '2.0.1', '"version" : "2.0.1"'],
  ])('parse_json(%s => %s)', (c, n, e) => test_version_parser(`./tests/**/project/*.json`, c, n, e));

  test.each([
    ['version="1.0.0"', '1.0.0', 'version="1.0.0"'],
    ['version= "1.0.0"', '1.0.0', 'version= "1.0.0"'],
    ['version = "1.0.0"', '1.0.0', 'version = "1.0.0"'],
    ['version="2.0.0"', '2.0.1', 'version="2.0.1"'],
    ['version= "2.0.0"', '2.0.1', 'version= "2.0.1"'],
    ['version = "2.0.0"', '2.0.1', 'version = "2.0.1"'],
  ])('parse_toml(%s => %s)', (c, n, e) => test_version_parser(`./tests/**/project/*.toml`, c, n, e));

  test.each([
    ['version=1.0.0', '1.0.0', 'version=1.0.0'],
    ['version= 1.0.0 ', '1.0.0', 'version= 1.0.0'],
    ['version=2.0.0', '2.0.1', 'version=2.0.1'],
    ['version= 2.0.0', '2.0.1', 'version= 2.0.1'],
  ])('parse_properties(%s => %s)', (c, n, e) => test_version_parser(`./tests/**/project/*.properties`, c, n, e));

  test.each([
    ['version: 1.0.0', '1.0.0', 'version: 1.0.0'],
    ['version: 2.0.0', '2.0.1', 'version: 2.0.1'],
  ])('parse_yaml(%s => %s)', (c, n, e) => test_version_parser(`./tests/**/project/*.yml`, c, n, e));

  test.each([
    ['1.0.0', '1.0.0', '1.0.0'],
    ['abc.yzy', '1.0.0', '1.0.0'],
  ])('parse_txt(%s => %s)', (c, n, e) => test_version_parser(`./tests/**/project/*.txt`, c, n, e));

  test.each`
    current                   | next       | file                        | pattern                                    | expected
    ${`PI_VERSION = '1.0.0'`} | ${`1.0.1`} | ${`/project/**/version.py`} | ${`(PI_VERSION\\s?=\\s?)(')([^']+)(')::2`} | ${`PI_VERSION = '1.0.1'`}
  `('parse [$current => $next] with [$pattern] in [$file]',
    ({ current, next, expected, file, pattern }) => test_version_parser(`./tests/**${file}::${pattern}`, current, next,
      expected));

});
