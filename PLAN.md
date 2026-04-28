# GitHub Pages Migration Plan (Implemented)

## Summary
- Production hosting moved to GitHub Pages only.
- Raspberry/VPS/Netlify deployment paths removed from repository workflows.
- `main-lumiere` remains release branch and now drives production publish to `lumiere.mktk.cc`.
- `dev-lumiere` no longer has a public deployment endpoint.

## CI/CD Changes
- `release-lumiere.yml` now performs:
  - fork release calculation
  - version commit/tag/release creation
  - static build and GitHub Pages deploy
- `sync-cinny-base.yml` remains for weekly/manual upstream mirror sync and PR creation.
- Removed workflows:
  - Raspberry deploy workflow
  - Netlify deploy workflows
  - legacy production deploy workflow

## Branch and Release Model
1. Develop in `dev-lumiere`.
2. Sync base via `main -> dev-lumiere` PRs.
3. Promote to `main-lumiere` via PR.
4. On push to `main-lumiere`, release and deploy to GitHub Pages.

## Constraints
- `main-lumiere` is immutable after release (no rebase/force-push).
- Version bump is conventional-commit-based from fork-only commit set.
- Production site is only `lumiere.mktk.cc`.
