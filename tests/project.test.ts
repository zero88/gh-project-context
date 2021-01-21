import { ProjectContextOps, FileVersionParser } from '../src/project';

describe('Parser', () => {
  function test_version_parser(patterns: string, current: string, next: string, expected: string) {
    const inputs = ProjectContextOps.parse(patterns);
    expect(inputs.length).toEqual(1);
    const pattern = inputs[0].pattern;
    expect(pattern.test(current)).toBeTruthy();
    expect(FileVersionParser.replace(next, current, pattern, inputs[0].group)).toEqual(expected);
  }

  test('parse_empty', () => {
    expect(ProjectContextOps.parse('').length).toEqual(0);
  });

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
    const patterns = `./tests/**/project/*.json,./tests/**/project/*.properties
    ./tests/**/project/*.toml,./tests/**/project/*.txt
    ./tests/**/project/*.yaml
    ./tests/**/project/*.yml`;
    const inputs = ProjectContextOps.parse(patterns);
    console.log(inputs);
    expect(inputs.length).toEqual(5);
  });

  test.each([
              ['"version":"1.0.0"', '1.0.0', '"version":"1.0.0"'],
              ['"version": "1.0.0"', '1.0.0', '"version": "1.0.0"'],
              ['"version" : "1.0.0"', '1.0.0', '"version" : "1.0.0"'],
              ['"version":"2.0.0"', '2.0.1', '"version":"2.0.1"'],
              ['"version": "2.0.0"', '2.0.1', '"version": "2.0.1"'],
              ['"version" : "2.0.0"', '2.0.1', '"version" : "2.0.1"'],
            ])('parse_json(%s|%s)', (current, next, expected) => {
    test_version_parser(`./tests/**/project/*.json`, current, next, expected);
  });

  test.each([
              ['version="1.0.0"', '1.0.0', 'version="1.0.0"'],
              ['version= "1.0.0"', '1.0.0', 'version= "1.0.0"'],
              ['version = "1.0.0"', '1.0.0', 'version = "1.0.0"'],
              ['version="2.0.0"', '2.0.1', 'version="2.0.1"'],
              ['version= "2.0.0"', '2.0.1', 'version= "2.0.1"'],
              ['version = "2.0.0"', '2.0.1', 'version = "2.0.1"'],
            ])('parse_toml(%s|%s)', (current, next, expected) => {
    test_version_parser(`./tests/**/project/*.toml`, current, next, expected);
  });

  test.each([
              ['version=1.0.0', '1.0.0', 'version=1.0.0'],
              ['version= 1.0.0 ', '1.0.0', 'version= 1.0.0'],
              ['version=2.0.0', '2.0.1', 'version=2.0.1'],
              ['version= 2.0.0', '2.0.1', 'version= 2.0.1'],
            ])('parse_properties(%s|%s)', (current, next, expected) => {
    test_version_parser(`./tests/**/project/*.properties`, current, next, expected);
  });

  test.each([
              ['version: 1.0.0', '1.0.0', 'version: 1.0.0'],
              ['version: 2.0.0', '2.0.1', 'version: 2.0.1'],
            ])('parse_yaml(%s|%s)', (current, next, expected) => {
    test_version_parser(`./tests/**/project/*.yml`, current, next, expected);
  });

  test.each([
              ['1.0.0', '1.0.0', '1.0.0'],
              ['abc.yzy', '1.0.0', '1.0.0'],
            ])('parse_txt(%s|%s)', (current, next, expected) => {
    test_version_parser(`./tests/**/project/*.txt`, current, next, expected);
  });

});
