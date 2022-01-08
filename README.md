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

You can use this action in 2 ways:

- Add it as first `job` in your `workflow`

```yaml
jobs:
  context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Project context
        id: project_context
        uses: zero88/gh-project-context@v1

  build:
    runs-on: ubuntu-latest
    needs: context
```

- Add it as first `step` in your `job`

```yaml
jobs:
  matrix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Project context
        id: project_context
        uses: zero88/gh-project-context@v1
      - name: build sth
        ...
```

- Action output

![Demo](.github/demo.png "Demo")

## Input and Output

### Input

| Name                  | Description                                                                                                     | Required | Default value                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------|----------|---------------------------------------------------|
| defaultBranch         | Project default branch                                                                                          | false    | `main`                                            |
| tagPrefix             | Tag Prefix                                                                                                      | false    | `v`                                               |
| releaseBranchPrefix   | Git Release Branch Prefix                                                                                       | false    | `release/`                                        |
| mergedReleaseMsgRegex | Merged release message regex                                                                                    | false    | `^Merge pull request #[0-9]+ from .+/release/.+$` |
| patterns              | Project patterns to search/replace a version.<br>E.g: `<glob_pattern_with_ext>::<regex_group>::<version_regex>` | false    | See [below](#default-pattern-input)               |
| shaLength             | Create output short commit id within length                                                                     | false    | `7`                                               |
| allowCommit           | CI: Allow git commit to fix version if not match                                                                | false    | `true`                                            |
| allowTag              | CI: Allow git tag if merged release branch                                                                      | false    | `true`                                            |
| userName              | CI: Username to commit                                                                                          | false    | `ci-bot`                                          |
| userEmail             | CI: User email to commit                                                                                        | false    | `actions@github.com`                              |
| mustSign              | CI: Required GPG sign when git commit/tag                                                                       | false    | `false`                                           |
| prefixCiMsg           | CI: Prefix bot message                                                                                          | false    | `<ci-auto-commit>`                                |
| correctVerMsg         | CI: Correct version message template                                                                            | false    | `Correct version`                                 |
| releaseVerMsg         | CI: Release version message template                                                                            | false    | `Release version`                                 |
| nextVerMsg            | CI: Next version message template                                                                               | false    | `Next version`                                    |
| nextVerMode           | CI: Next version mode to choose for upgrading version after merged release PR. One of: MAJOR,MINOR,PATCH,NONE   | false    | `NONE`                                            |
| dry                   | CI: Dry run. If `true`, action will run without do modify files or git commit/tag                               | false    | `false`                                           |

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

| Name                   | Description                                                                                                                                  |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| branch                 | Current branch name or tag name                                                                                                              |
| onDefaultBranch        | Check whether current event is on default branch or not                                                                                      |
| isPR                   | Check whether current event is on pull request or not                                                                                        |
| isReleasePR            | Check whether current event is on release pull request or not                                                                                |
| isMerged               | Check whether current event is merged PR                                                                                                     |
| isClosed               | Check whether current event is close PR but not merged into target branch                                                                    |
| isAfterMergedReleasePR | Check whether current event is a merged commit after merged release pull request into default branch or not                                  |
| isTag                  | Check whether current event is on ref tag                                                                                                    |
| commitMsg              | The latest commit message                                                                                                                    |
| commitId               | The latest commit id                                                                                                                         |
| shortCommitId          | The latest short commit id                                                                                                                   |
| version                | Current tag version or release version                                                                                                       |
| ci_mustFixVersion      | CI: Need to fix version to match with release name                                                                                           |
| ci_needTag             | CI: Need to tag new version if release branch is merged                                                                                      |
| ci_isPushed            | CI: Check whether if auto commit is pushed to remote                                                                                         |
| ci_commitId            | CI: auto commit id                                                                                                                           |
| ci_commitMsg           | CI: auto commit message                                                                                                                      |
| decision_build         | Decision: Should run the next step: such as build & test. Default value: `!ci.isPushed && !isClosed && !isMerged && !isAfterMergedReleasePR` |
| decision_publish       | Should publish artifact: such as push artifact to any registry. Default value: `decision.build and (isOnMaster or isTag)`                    |
| ver_current            | Current version in config file                                                                                                               |
| ver_nextMajor          | Suggest next major version if after release and `ver_current` is compatible with semver                                                      |
| ver_nextMinor          | Suggest next minor version if after release and `ver_current` is compatible with semver                                                      |
| ver_nextPatch          | Suggest next patch version if after release and `ver_current` is compatible with semver                                                      |

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
