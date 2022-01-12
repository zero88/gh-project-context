import { CIContext, Decision, ProjectContext, Versions } from './projectContext';

export type RuntimeVersions = Omit<Versions, 'current'>
export type RuntimeContext = Omit<ProjectContext, 'version' | 'versions' | 'ci' | 'decision'> & {
  ci?: CIContext,
  decision?: Decision,
  versions: RuntimeVersions
}
