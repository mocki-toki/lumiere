# Lumiere Fork Operations Guide

This file is the authoritative operational guide for branch management, base sync, and releases in the Lumiere fork.

## 1. Branch topology
- `upstream/dev`
  - Source of truth for Cinny base.
- `main` (in this fork)
  - Fast-forward mirror of `upstream/dev`.
  - No Lumiere product changes should be authored directly here.
- `dev-lumiere`
  - Integration branch for all Lumiere development.
  - Staging environment branch (`dev-lumiere.mktk.cc`).
- `main-lumiere`
  - Production/release branch (`lumiere.mktk.cc`).
  - Release tags `lumiere-v*` are created from this branch.

## 2. Required invariants
- `main` should track `upstream/dev` as close as possible.
- `main-lumiere` history is stable after release:
  - no rebase
  - no force-push
- Release versioning must be computed from fork-only commits:
  - commits not reachable from `main`.
- Release tag namespace must stay isolated from Cinny:
  - `lumiere-vX.Y.Z`.

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

### 3.2 Deploy automation
Workflow: `.github/workflows/deploy-lumiere.yml`

Purpose:
- Build and push branch image to GHCR.
- Deploy selected service on Raspberry via VPS SSH jump.

Branch/domain mapping:
- `dev-lumiere` -> `dev-lumiere.mktk.cc`
- `main-lumiere` -> `lumiere.mktk.cc`

### 3.3 Release automation
Workflow: `.github/workflows/release-lumiere.yml`

Purpose:
- On `main-lumiere`, calculate next Lumiere version from fork-only commits.
- Update `src/app/branding/version.ts`.
- Commit release bump, create `lumiere-v*` tag, publish GitHub release.

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
2. Validate in dev deployment.
3. Keep commit messages conventional for predictable release bumps.

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
  - deployment workflow completed

## 5. Version fields and ownership
- File: `src/app/branding/version.ts`
  - `CINNY_VERSION`:
    - maintained by release workflow from `main:package.json.version`.
  - `LUMIERE_VERSION`:
    - maintained by release workflow from fork-only commit analysis.

Notes:
- `package.json.version` is inherited from base and is not the Lumiere release source of truth.
- Lumiere release identity is defined by `LUMIERE_VERSION` + `lumiere-v*` tags.

## 6. Recovery and troubleshooting
- Sync PR missing:
  - run `Sync Cinny Base` manually from Actions tab.
- No release created on `main-lumiere` push:
  - check if releasable commit types exist since previous `lumiere-v*`.
- Wrong bump level:
  - verify commit headers/footers follow conventional commits.
- Unexpected base drift:
  - verify `main` still tracks `upstream/dev` and sync workflow has successful runs.

## 7. Non-authoritative legacy pipeline
- Upstream-origin release assets (`prod-deploy.yml`, `semantic-release` config) remain in repository history.
- Lumiere production release process must follow:
  - `release-lumiere.yml`
  - `lumiere-v*` tags
  - `src/app/branding/version.ts`
- `prod-deploy.yml` is marked legacy and requires explicit manual confirmation input.
