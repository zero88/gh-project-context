import * as aexec from '@actions/exec';
import { ExecOptions } from '@actions/exec';

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export const exec = async (command: string, args: string[] = [], silent?: boolean): Promise<ExecResult> => {
  let stdout: string = '';
  let stderr: string = '';

  const options: ExecOptions = {
    silent: silent,
    ignoreReturnCode: true,
  };
  options.listeners = {
    stdout: (data: Buffer) => {
      stdout += data.toString();
    },
    stderr: (data: Buffer) => {
      stderr += data.toString();
    },
  };

  const returnCode: number = await aexec.exec(command, args, options);

  return {
    success: returnCode === 0,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
};

export const strictExec = async (command: string, args: string[] = [], silent?: boolean,
                                 msgIfError?: string): Promise<ExecResult> => {
  return exec(command, args, silent).then(r => {
    if (!r.success) {
      throw `${msgIfError}. Error: ${r.stderr ?? r.stdout}`;
    }
    return r;
  });
};
