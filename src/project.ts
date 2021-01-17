import { lstatSync } from 'fs';
import * as glob from 'glob';

export const parsePatterns = (patterns: String): ProjectContextInput[] => {
  return patterns.split(/\r?\n/)
                 .reduce<string[]>((acc, line) => acc.concat(line.split(',')).filter(pat => pat).map(pat => pat.trim()),
                                   [])
                 .map(item => item.split('::'))
                 .map(arr => ({ path: arr?.[0], versionPath: arr?.[1], ext: arr?.[2] }));
};

export interface ProjectContextInput {

  /**
   * File ext
   * @type {string}
   */
  readonly ext: string;
  /**
   * File
   * @type {string}
   */
  readonly path: string;
  readonly versionPath: string;

}

export interface ProjectContext {
  readonly version: string;
}

export const paths = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter(path => lstatSync(path).isFile()),
    );
  }, []);
};
