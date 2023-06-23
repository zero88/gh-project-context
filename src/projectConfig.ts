import { ChangelogConfig } from './changelog';
import { GitOpsConfig } from './gitOps';
import { GitParserConfig } from './gitParser';
import { VersionStrategy } from './versionStrategy';

export type ProjectConfig = {

  readonly gitParserConfig: GitParserConfig;
  readonly gitOpsConfig: GitOpsConfig;
  readonly versionStrategy: VersionStrategy;
  readonly changelogConfig: ChangelogConfig;
  readonly token?: string;
}
