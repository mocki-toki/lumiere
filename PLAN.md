# Lumiere Fork Branching, Release, and Base Sync Plan

## Summary
- `main` is a technical mirror branch for Cinny base updates (`upstream/dev -> main`, fast-forward only).
- `dev-lumiere` is the integration/testing branch with auto-deploy to `dev-lumiere.mktk.cc`.
- `main-lumiere` is the release branch with auto-deploy to `lumiere.mktk.cc`.
- Fork versions are calculated only from fork commits, not from upstream base commits.
- Fork release tags use a separate namespace: `lumiere-vX.Y.Z`.

## CI/CD Changes
- Add `sync-cinny-base.yml` workflow:
  - Trigger: `schedule` (weekly) + `workflow_dispatch`.
  - Update `main` from `upstream/dev` (fast-forward only).
  - Open/update PR `main -> dev-lumiere` with label `cinny-base-sync` when base changed.
- Add `release-lumiere.yml` workflow:
  - Trigger: push to `main-lumiere`.
  - Determine fork commit set since last `lumiere-v*` tag, excluding commits reachable from `main`.
  - Compute version bump by conventional commits:
    - `BREAKING CHANGE` or `type!:` => major
    - `feat` => minor
    - `fix` / `perf` => patch
  - Update `src/app/branding/version.ts`:
    - `CINNY_VERSION` from `main:package.json.version`
    - `LUMIERE_VERSION` bumped release version
  - Commit, tag, and publish GitHub release.

## Branching and Release Workflow
1. Develop in `dev-lumiere` (auto-deploy to dev domain).
2. Weekly base sync updates `main` and opens PR into `dev-lumiere`.
3. Resolve conflicts in that PR if needed, then merge.
4. Promote fork changes to `main-lumiere` by PR.
5. Merge PR to `main-lumiere` to trigger release and production deployment.

## Constraints and Defaults
- `main-lumiere` is immutable after release (no rebase/force-push).
- Bump rules use conventional commits defaults (`feat`, `fix`, `perf`, `BREAKING`).
- Fork release automation updates only `version.ts` (not `package.json.version`).
