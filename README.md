# Lumiere
A Matrix client fork based on Cinny, currently rebranded as Lumiere.
- [Source Code](https://github.com/mocki-toki/lumiere)
- [Contributing](./CONTRIBUTING.md)
- [Fork Process Guide](./agents.md)
- [Bot Matrix Buttons Spec (v1)](./docs/bot-matrix-buttons-v1.md)
- [Bot Matrix Buttons E2E Checklist](./docs/bot-matrix-buttons-e2e-checklist.md)

## Getting started
Run locally with the commands below.

## Fork Branching and Release Process
This repository uses a fork-specific branching and release model with production deployment on GitHub Pages.

### Branch roles
- `main`:
  - Technical mirror of Cinny base.
  - Updated only from `upstream/dev` via fast-forward sync.
  - Not used for Lumiere feature development.
- `dev-lumiere`:
  - Integration branch for Lumiere development.
  - No public deployment target.
- `main-lumiere`:
  - Release branch for production Lumiere.
  - Source of production deployments to `https://lumiere.mktk.cc`.
  - Immutable after release (no force-push/rebase).

### CI workflows used for fork lifecycle
- `.github/workflows/sync-cinny-base.yml`
  - Trigger: weekly (`cron`) and manual (`workflow_dispatch`).
  - Syncs `main` to `upstream/dev` via fast-forward.
  - Creates/updates PR `main -> dev-lumiere` with label `cinny-base-sync`.
- `.github/workflows/release-lumiere.yml`
  - Trigger: push to `main-lumiere` and manual dispatch.
  - Calculates fork release version, updates `src/app/branding/version.ts`, creates `lumiere-v*` tag and GitHub Release.
  - Deploys released build to GitHub Pages (production site).

### Versioning model
- `CINNY_VERSION` and `LUMIERE_VERSION` are stored in:
  - `src/app/branding/version.ts`
- `CINNY_VERSION`:
  - Sourced from `main:package.json.version` during release workflow.
- `LUMIERE_VERSION`:
  - Calculated from fork commits only (commits not reachable from `main`).
  - Uses conventional commit bump rules:
    - `BREAKING CHANGE` or `type!:` => major
    - `feat` => minor
    - `fix` / `perf` => patch
    - everything else => no release bump
- Fork release tag namespace:
  - `lumiere-vX.Y.Z`

### Daily workflow
1. Implement features in `dev-lumiere`.
2. Merge weekly base sync PR (`main -> dev-lumiere`) when available.
3. Open PR `dev-lumiere -> main-lumiere` for release-ready changes.
4. Merge into `main-lumiere` to publish fork release and deploy production.

### Upstream base update workflow
1. Weekly workflow fetches `upstream/dev`.
2. If base moved, `main` is fast-forwarded.
3. Workflow opens/updates PR `main -> dev-lumiere`.
4. Resolve conflicts in that PR and merge.
5. Continue normal development/release cycle.

### Important safety rules
- Do not develop Lumiere features directly on `main`.
- Do not rebase/force-push `main-lumiere` after releases.
- Keep release commit messages conventional if they should influence version bump.
- Use PR merges into `main-lumiere` for predictable release history.
- Keep GitHub Pages as the only production deployment target.

### Optional local release check
- You can run the release calculator locally:
  - `npm run release:lumiere`
- This command updates `src/app/branding/version.ts` in the working tree, so run it only when you intentionally want to validate release computation behavior.

### Production hosting model
- Lumiere production is served by GitHub Pages at `lumiere.mktk.cc`.
- The repository Pages source must be set to `GitHub Actions`.
- `dev-lumiere.mktk.cc` is intentionally decommissioned.

## Self-hosting
To host Lumiere on your own, build from source and serve `dist/` with your preferred web server.

* The default homeservers and explore pages are defined in [`config.json`](config.json).

* You need to set up redirects to serve the assests. Example configurations; [nginx](contrib/nginx/cinny.domain.tld.conf), [caddy](contrib/caddy/caddyfile).
    * If you have trouble configuring redirects you can [enable hash routing](config.json#L35) — the url in the browser will have a `/#/` between the domain and open channel.

* To deploy on subdirectory, you need to rebuild the app youself after updating the `base` path in [`build.config.ts`](build.config.ts).
    * For example, if you want to deploy on `https://example.com/app`, then set `base: '/app'`.

<details><summary><b>PGP Public Key to verify tarball</b></summary>

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

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
mxFo+ioe/ABCufSmyqFye0psX3Sp
=WtqZ
-----END PGP PUBLIC KEY BLOCK-----
```
</details>

## Local development
> [!TIP]
> We recommend using a version manager as versions change very quickly. You will likely need to switch between multiple Node.js versions based on the needs of different projects you're working on. [NVM on windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) on Windows and [nvm](https://github.com/nvm-sh/nvm) on Linux/macOS are pretty good choices. Recommended nodejs version is Krypton LTS (v24.13.1).

Execute the following commands to start a development server:
```sh
npm ci # Installs all dependencies
npm start # Serve a development version
```

To build the app:
```sh
npm run build # Compiles the app into the dist/ directory
```

### Running with Docker
This repository includes a Dockerfile, which builds the application from source and serves it with Nginx on port 80. To
use this locally, you can build the container like so:
```
docker build -t lumiere:latest .
```

You can then run the container you've built with a command similar to this:
```
docker run -p 8080:80 lumiere:latest
```

This will forward your `localhost` port 8080 to the container's port 80. You can visit the app in your browser by navigating to `http://localhost:8080`.
