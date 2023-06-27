import * as github from '@actions/github';

const originalContext = { ...github.context };

const reload = () => Object.defineProperty(github, 'context', { value: originalContext });
const mock = (data: any) => Object.defineProperty(github, 'context', { value: data });

export const runnerContext = { reload, mock };
