import { VersionParser } from '../src/versionParser';
import { createVersionStrategy } from '../src/versionStrategy';

const test_version_parser = async (patterns: string, next: string, expected: {} | string) => {
  const inputs = createVersionStrategy(patterns).versionPatterns;
  expect(inputs.length).toEqual(1);
  expect(await VersionParser.replace(inputs, next, true)).toEqual(expected);
};

describe('Fix version', () => {

  test.each([
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['2.0.1', { files: ['./tests/resources/project/p.json'], isChanged: true, version: '2.0.1' }],
    ['2.0.1', { files: ['./tests/resources/project/p.json'], isChanged: true, version: '2.0.1' }],
    ['2.0.1', { files: ['./tests/resources/project/p.json'], isChanged: true, version: '2.0.1' }],
  ])('parse_json(%s => %s)', async (n, e) => test_version_parser(`./tests/**/project/*.json`, n, e));

  test.each([
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['2.0.1', { files: ['./tests/resources/project/p.toml'], isChanged: true, version: '2.0.1' }],
    ['2.0.1', { files: ['./tests/resources/project/p.toml'], isChanged: true, version: '2.0.1' }],
    ['2.0.1', { files: ['./tests/resources/project/p.toml'], isChanged: true, version: '2.0.1' }],
  ])('parse_toml(%s => %s)', async (n, e) => test_version_parser(`./tests/**/project/*.toml`, n, e));

  test.each([
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['2.0.1', { files: ['./tests/resources/project/p.properties'], isChanged: true, version: '2.0.1' }],
    ['2.0.1', { files: ['./tests/resources/project/p.properties'], isChanged: true, version: '2.0.1' }],
  ])('parse_properties(%s => %s)', async (n, e) => test_version_parser(`./tests/**/project/*.properties`, n, e));

  test.each([
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['2.0.1', { files: ['./tests/resources/project/p.yml'], isChanged: true, version: '2.0.1' }],
  ])('parse_yaml(%s => %s)', async (n, e) => test_version_parser(`./tests/**/project/*.yml`, n, e));

  test.each([
    ['1.0.0', { files: [], isChanged: false, version: '1.0.0' }],
    ['abc.yzy', { files: ['./tests/resources/project/p.txt'], isChanged: true, version: 'abc.yzy' }],
    ['2.0.1', { files: ['./tests/resources/project/p.txt'], isChanged: true, version: '2.0.1' }],
  ])('parse_txt(%s => %s)', async (n, e) => test_version_parser(`./tests/**/project/*.txt`, n, e));

  test.each`
    next       | file                        | pattern                                    | expected
    ${`1.0.1`} | ${`/project/**/version.py`} | ${`(PI_VERSION\\s?=\\s?)(')([^']+)(')::2`} | ${{
    files: ['./tests/resources/project/default/version.py'],
    isChanged: true,
    version: '1.0.1',
  }}
  `('parse [$current => $next] with [$pattern] in [$file]',
    ({ next, expected, file, pattern }) => test_version_parser(`./tests/**${file}::${pattern}`, next, expected));

});
