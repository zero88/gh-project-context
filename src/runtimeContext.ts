import { ProjectContext, Versions } from './projectContext';

export type RuntimeVersions = Omit<Versions, 'current'>
export type RuntimeContext = Omit<ProjectContext, 'version' | 'versions' | 'ci' | 'decision'> & {
  defaultBranch: string,
  versions: RuntimeVersions
}
