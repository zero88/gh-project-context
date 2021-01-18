import { GitContextInput } from '../src/git';

test('regex message', () => {
  const regex = new GitContextInput().mergedReleaseMsgRegex;
  console.log(regex);
  expect(regex.test(`Merge pull request #3 from zero88/release/1.0.1
  
  Try`)).toBeTruthy();
});
