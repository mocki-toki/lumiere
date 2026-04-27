# Lumiere deploy bundle

This directory is synced to Raspberry by `.github/workflows/deploy-lumiere.yml`.

## Runtime layout on Raspberry

- Path: `/home/pi/lumiere-deploy`
- Compose file: `compose.yml`
- Env file: `.env`

## Services

- `lumiere-main` -> `:8083` (proxied by VPS to `lumiere.mktk.cc`)
- `lumiere-dev` -> `:8084` (proxied by VPS to `dev-lumiere.mktk.cc`)

## Required GitHub repository secrets

- `DEPLOY_SSH_PRIVATE_KEY`: private deploy key used by Actions.
- `DEPLOY_KNOWN_HOSTS`: known_hosts entries for `5.42.98.216` and `192.168.1.182`.

## One-time VPS bootstrap (manual)

- Add nginx server blocks for `lumiere.mktk.cc` and `dev-lumiere.mktk.cc`
  proxying to `192.168.1.182:8083` and `192.168.1.182:8084`.
- Issue/renew TLS certs on VPS and reload nginx.
