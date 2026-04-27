# Lumiere Deployment

## Branch-to-domain mapping

- `main-lumiere` -> `https://lumiere.mktk.cc` -> Raspberry `:8083`
- `dev-lumiere` -> `https://dev-lumiere.mktk.cc` -> Raspberry `:8084`

## Architecture

- VPS (`5.42.98.216`) runs nginx and TLS termination.
- VPS proxies to Raspberry private IP `192.168.1.182`.
- GitHub Actions reaches Raspberry via SSH jump through VPS.
- Application runtime is Docker Compose on Raspberry (`/home/pi/lumiere-deploy`).

## Repository files

- `deploy/lumiere/compose.yml` - runtime services on Raspberry.
- `deploy/lumiere/.env.template` - image placeholders.
- `.github/workflows/deploy-lumiere.yml` - build+deploy pipeline.
- `deploy/vps/lumiere-proxy.conf` - nginx vhost config for VPS.
- `deploy/vps/bootstrap-vps-lumiere.sh` - one-time VPS bootstrap helper.

## Required GitHub secrets

- `DEPLOY_SSH_PRIVATE_KEY` - CI deploy key (private key, no passphrase).
- `DEPLOY_KNOWN_HOSTS` - known_hosts entries for:
  - `5.42.98.216`
  - `192.168.1.182`

## One-time VPS bootstrap

Run as `root` on VPS:

```bash
cd /path/to/repo/deploy/vps
./bootstrap-vps-lumiere.sh
```

This bootstrap issues/uses certificate files under `/etc/letsencrypt/live/lumiere.mktk.cc/`.
