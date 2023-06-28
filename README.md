# gh-project-context

![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/zero88/gh-project-context?sort=semver&style=flat-square)

Build project context and correct Project version in any language version before release.

This action is build a Project context depends on GitHub event to make decision in further step, e.g: do build, do test,
do analysis, do tag, do release based on your workflow model.

It also verifies and corrects automatically Project version in metadata file in `release pull request` or `tag`:

- NodeJS: `package.json`
- Java: Gradle with `gradle.properties`
- Python: `Poetry` with `pyproject.toml` or `version.py`
- Plain text: `VERSION.txt`
- Or any version metadata file if you know some magical regex skill

## Usage

### Trigger precondition

The usual example

```yaml
on:
  create:
    branches: [ 'release/**' ] ## To create a release PR
  push:
    branches: ## On main branch and/or all release branches (optional) 
      - main
      - release/**
    tags: [ 'v*' ] ## Release tag version
    paths-ignore:
      - '.github/ISSUE_TEMPLATE/**'
      - '.github/*.yml'
      - 'LICENSE'
  pull_request:
    types: [ opened, synchronize, reopened, closed ]
    branches: [ main ]
    paths-ignore:
      - '.github/ISSUE_TEMPLATE/**'
      - '.github/*.yml'
      - 'LICENSE'
```

More detailed at [GitHub docs](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#on)

### Integrate the action in your workflow

You can use this action in 2 ways:

1. Add it as first `job` in your `workflow`
  ```yaml
  jobs:
    context:
      runs-on: ubuntu-latest
      outputs:
        branch: ${{ steps.context.outputs.branch }}
        shouldBuild: ${{ steps.context.outputs.decision_build }}
        shouldPublish: ${{ steps.context.outputs.decision_publish }}
        isRelease: ${{ steps.context.outputs.isTag }}
        version: ${{ steps.context.outputs.version }}
        commitId: ${{ steps.context.outputs.shortCommitId }}
        semanticVersion: ${{ steps.semantic.outputs.semanticVersion }}

      steps:
        - uses: actions/checkout@v2
        - name: Project context
          id: context
          uses: zero88/gh-project-context@v1
  
    build:
      runs-on: ubuntu-latest
      needs: context
      if: needs.context.outputs.shouldBuild == 'true' # condition to build
  ```

2. Add it as `step` in your `job`

  ```yaml
  jobs:
    matrix:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Project context
          uses: zero88/gh-project-context@v1
          id: project_context
        - name: Build project
          if: steps.project_context.outputs.decision_build == 'true' # condition to build
          shell: bash
          runs: |
            npm ci
            npm run build
        - name: Build project
          if: steps.project_context.outputs.decision_publish == 'true' # condition to publish
          shell: bash
          runs: |
            npm publish
  ```

### Action output

```shell
Run zero88/gh-project-context@v1.2
Loading...
[CI::Process] Evaluate context on main
  Searching version in file...
  Current Version: 0.0.3

Project context
Version context
  {
    "branch": "main",
    "current": "0.0.3",
    "version": "0.0.3"
  }
CI context
  {
    "isPushed": false
  }
CI decision
  {
    "build": true,
    "publish": true
  }
Action Output
  {
    "branch": "main",
    "ci_isPushed": false,
    "commitId": "c1c69ba9f41eeffaf260b7a6174fc37493c8fb42",
    "commitMsg": "chore: bump to next version",
    "decision_build": true,
    "decision_publish": true,
    "isAfterMergedReleasePR": false,
    "isClosed": false,
    "isManualOrSchedule": false,
    "isMerged": false,
    "isPR": false,
    "isReleasePR": false,
    "isTag": false,
    "onDefaultBranch": true,
    "shortCommitId": "c1c69ba",
    "version": "0.0.3",
    "versions_branch": "main",
    "versions_current": "0.0.3"
  }
```

## Input and Output

### Input

| Name                  | Description                                                                                                   | Required | Default value                                     |
|-----------------------|---------------------------------------------------------------------------------------------------------------|----------|---------------------------------------------------|
| defaultBranch         | Project default branch                                                                                        | false    | `main`                                            |
| tagPrefix             | Tag Prefix                                                                                                    | false    | `v`                                               |
| releaseBranchPrefix   | Git Release Branch Prefix                                                                                     | false    | `release/`                                        |
| mergedReleaseMsgRegex | Merged release message regex                                                                                  | false    | `^Merge pull request #[0-9]+ from .+/release/.+$` |
| patterns              | The patterns to search/replace a version.<br>E.g: `<glob_pattern_with_ext>::<regex_group>::<version_regex>`   | false    | See [below](#default-pattern-input)               |
| shaLength             | Create output short commit id within length                                                                   | false    | `7`                                               |
| allowCommit           | CI: Allow git commit to fix version if not match                                                              | false    | `true`                                            |
| allowTag              | CI: Allow git tag if merged release branch                                                                    | false    | `true`                                            |
| userName              | CI: Username to commit                                                                                        | false    | `ci-bot`                                          |
| userEmail             | CI: User email to commit                                                                                      | false    | `actions@github.com`                              |
| mustSign              | CI: Required GPG sign when git commit/tag                                                                     | false    | `false`                                           |
| prefixCiMsg           | CI: Prefix bot message                                                                                        | false    | `<ci-auto-commit>`                                |
| correctVerMsg         | CI: Correct version message template                                                                          | false    | `Correct version`                                 |
| releaseVerMsg         | CI: Release version message template                                                                          | false    | `Release version`                                 |
| nextVerMsg            | CI: Next version message template                                                                             | false    | `Next version`                                    |
| nextVerMode           | CI: Next version mode to choose for upgrading version after merged release PR. One of: MAJOR,MINOR,PATCH,NONE | false    | `NONE`                                            |
| token                 | CI: GitHub token to create a new Release Pull Request                                                         | false    | ``                                                |
| dry                   | CI: Dry run. If `true`, action will run without do modify files or git push or git tag                        | false    | `false`                                           |

#### Default Pattern Input

```
pyproject.toml::(version\s?=\s?)(")([^"]+)(")::2
package?(-lock).json::("version"\s?:\s?)(")([^"]+)(")::2
@(gradle|maven|pom|project).properties::(version\s?=\s?)(.+)::1
@(application|version).yml::(version:\s)(.+)::1
@(VERSION|version)?(.txt)::.+::0
```

### Output

Project context based on current `GitHub event`

| Name                   | Description                                                                                                                                                      |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| branch                 | Current branch name or tag name                                                                                                                                  |
| onDefaultBranch        | Check whether current event is on default branch or not                                                                                                          |
| isPR                   | Check whether current event is on pull request or not                                                                                                            |
| isReleaseBranch        | Check whether current event is on release branch or not                                                                                                          |
| isReleasePR            | Check whether current event is on release pull request or not                                                                                                    |
| isMerged               | Check whether current event is merged PR                                                                                                                         |
| isClosed               | Check whether current event is close PR but not merged into target branch                                                                                        |
| isAfterMergedReleasePR | Check whether current event is a merged commit after merged release pull request into default branch or not                                                      |
| isTag                  | Check whether current event is on ref tag                                                                                                                        |
| commitMsg              | The latest commit message                                                                                                                                        |
| commitId               | The latest commit id                                                                                                                                             |
| shortCommitId          | The latest short commit id                                                                                                                                       |
| version                | Current tag version or release version                                                                                                                           |
| ci_mustFixVersion      | CI: Need to fix version to match with release name                                                                                                               |
| ci_needTag             | CI: Need to tag new version if release branch is merged                                                                                                          |
| ci_isPushed            | CI: Check whether if auto commit is pushed to remote                                                                                                             |
| ci_commitId            | CI: auto commit id                                                                                                                                               |
| ci_commitMsg           | CI: auto commit message                                                                                                                                          |
| decision_build         | Decision: Should run the next step: such as build & test. Default value: `!ci.isPushed && !isClosed && !isMerged && !isAfterMergedReleasePR && !isReleaseBranch` |
| decision_publish       | Should publish artifact: such as push artifact to any registry. Default value: `decision.build and (onDefaultBranch or isTag)`                                   |
| ver_current            | Current version in config file                                                                                                                                   |
| ver_nextMajor          | Suggest next major version if after release and `ver_current` is compatible with semver                                                                          |
| ver_nextMinor          | Suggest next minor version if after release and `ver_current` is compatible with semver                                                                          |
| ver_nextPatch          | Suggest next patch version if after release and `ver_current` is compatible with semver                                                                          |

## Note

### Latest commit message

`commitMsg` is not available by default when synchronize/open `pull-request`. In case, you want to use the latest commit
message in `pull-request`, need to tweak your build as below:

```yaml
- uses: actions/checkout@v2
  with:
    token: ${{ secrets.YOUR_GITHUB_TOKEN }}
    fetch-depth: 2
- uses: zero88/gh-project-context@v1.1
```

## Use Cases

TBD
