# Lumiere Fork Operations Guide

This file is the authoritative operational guide for branch management, base sync, release versioning, and production deployment in the Lumiere fork.

## 1. Branch topology
- `upstream/dev`
  - Source of truth for Cinny base.
- `main` (in this fork)
  - Fast-forward mirror of `upstream/dev`.
  - No Lumiere product changes should be authored directly here.
- `dev-lumiere`
  - Integration branch for Lumiere development.
  - No public deployment target.
- `main-lumiere`
  - Production release branch.
  - GitHub Pages deployments are published from released commits on this branch.

## 2. Required invariants
- `main` should track `upstream/dev` as close as possible.
- `main-lumiere` history is stable after release:
  - no rebase
  - no force-push
- Release versioning must be computed from fork-only commits:
  - commits not reachable from `main`.
- Release tag namespace must stay isolated from Cinny:
  - `lumiere-vX.Y.Z`.
- Production hosting must remain GitHub Pages only.

## 3. Automation map

### 3.1 Base sync automation
Workflow: `.github/workflows/sync-cinny-base.yml`

Purpose:
- Fetch `upstream/dev`.
- Fast-forward `main` if upstream moved.
- Open/update PR `main -> dev-lumiere` with label `cinny-base-sync`.

Triggers:
- Weekly schedule.
- Manual dispatch.

Expected outcome:
- If no upstream changes: no branch movement.
- If upstream changed: `main` updated and sync PR created/updated.

### 3.2 Release + production deploy automation
Workflow: `.github/workflows/release-lumiere.yml`

Purpose:
- On `main-lumiere`, calculate next Lumiere version from fork-only commits.
- Update `src/app/branding/version.ts`.
- Commit release bump, create `lumiere-v*` tag, publish GitHub release.
- Build static app and deploy to GitHub Pages (`lumiere.mktk.cc`).

Release script:
- `scripts/release-lumiere.mjs`

Version calculation rules:
- major:
  - `BREAKING CHANGE:` footer or `type!:` header
- minor:
  - `feat:`
- patch:
  - `fix:` or `perf:`
- no release:
  - all other commit types only

## 4. Human workflow

### 4.1 Feature development
1. Branch/work on `dev-lumiere`.
2. Keep commit messages conventional for predictable release bumps.
3. Periodically merge base-sync PRs into `dev-lumiere`.

### 4.2 Cinny base update handling
1. Wait for weekly sync PR or run manual sync workflow.
2. Review PR `main -> dev-lumiere`.
3. Resolve conflicts if present.
4. Merge PR to apply upstream changes into Lumiere development line.

### 4.3 Release promotion
1. Open PR `dev-lumiere -> main-lumiere`.
2. Review and merge when release-ready.
3. `release-lumiere.yml` runs automatically on push to `main-lumiere`.
4. Confirm:
  - new `lumiere-v*` tag exists
  - GitHub Release exists
  - Pages deployment is successful
  - `https://lumiere.mktk.cc` serves updated build

## 5. Version fields and ownership
- File: `src/app/branding/version.ts`
  - `CINNY_VERSION`:
    - maintained by release workflow from `main:package.json.version`.
  - `LUMIERE_VERSION`:
    - maintained by release workflow from fork-only commit analysis.

Notes:
- `package.json.version` is inherited from base and is not the Lumiere release source of truth.
- Lumiere release identity is defined by `LUMIERE_VERSION` + `lumiere-v*` tags.

## 6. Repository and platform settings
- Default branch must be `main-lumiere`.
- GitHub Pages must be enabled with source `GitHub Actions`.
- Pages custom domain must be `lumiere.mktk.cc` with HTTPS enforced.
- `dev-lumiere.mktk.cc` must stay decommissioned.

## 7. Recovery and troubleshooting
- Sync PR missing:
  - run `Sync Cinny Base` manually from Actions tab.
- No release created on `main-lumiere` push:
  - check if releasable commit types exist since previous `lumiere-v*`.
- Wrong bump level:
  - verify commit headers/footers follow conventional commits.
- Pages deployment failed:
  - check build logs in `Release Lumiere` workflow and verify Pages settings.
- Unexpected base drift:
  - verify `main` tracks `upstream/dev` and sync workflow has successful runs.
