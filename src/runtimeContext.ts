export interface RuntimeVersion {
  /**
   * Current version from tag/release version or branch name
   */
  readonly branch: string;
}

export interface RuntimeContext {
  readonly defaultBranch: string;
  /**
   * Current branch name or tag name
   */
  readonly branch: string;
  /**
   * Check whether current event is on default branch or not
   * @type {boolean}
   */
  readonly onDefaultBranch: boolean;
  /**
   * Check whether current event is on branch or not
   * @type {boolean}
   */
  readonly isBranch: boolean;
  /**
   * Check whether current event is on pull request or not
   * @type {boolean}
   */
  readonly isPR: boolean;
  /**
   * Check whether current event is on ref tag
   * @type {boolean}
   */
  readonly isTag: boolean;
  /**
   * Check whether current event is by schedule or not
   */
  readonly isSchedule: boolean;
  /**
   * Check whether current event is by manual or dispatch from another workflow or event from repository
   */
  readonly isDispatch: boolean;
  /**
   * Check whether current event is release event on regardless of branch, pull-request or tag.
   *
   * The release event is identified by release branch prefix and release tag prefix.
   * @type {boolean}
   */
  readonly isRelease: boolean;
  /**
   * Check whether current event is a merged commit after merged release pull request into default branch or not
   * @type {boolean}
   */
  readonly isAfterMergedReleasePR: boolean;
  /**
   * Check whether current event is merged PR
   * @type {boolean}
   */
  readonly isMerged: boolean;
  /**
   * Check whether current event is close PR but not merged into target branch
   * @type {boolean}
   */
  readonly isClosed: boolean;
  /**
   * Check whether current event is open PR or create branch
   * @type {boolean}
   */
  readonly isOpened: boolean;
  /**
   * Latest commit message
   * @type {string}
   */
  readonly commitMsg: string;
  /**
   * Latest commit id
   * @type {string}
   */
  readonly commitId: string;
  /**
   * Latest short commit id
   * @type {string}
   */
  readonly commitShortId: string;

  readonly versions: RuntimeVersion,
}
