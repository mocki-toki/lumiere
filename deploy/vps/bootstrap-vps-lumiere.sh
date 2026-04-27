#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root on VPS" >&2
  exit 1
fi

CONF_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lumiere-proxy.conf"
CONF_DST="/etc/nginx/sites-available/lumiere-proxy.conf"
LINK_DST="/etc/nginx/sites-enabled/lumiere-proxy.conf"

install -m 0644 "$CONF_SRC" "$CONF_DST"
ln -snf "$CONF_DST" "$LINK_DST"

mkdir -p /var/www/html

if ! certbot certificates 2>/dev/null | grep -q "lumiere.mktk.cc"; then
  certbot certonly --webroot -w /var/www/html \
    -d lumiere.mktk.cc -d dev-lumiere.mktk.cc \
    --agree-tos -m admin@mktk.cc --non-interactive
fi

nginx -t
systemctl reload nginx

echo "Bootstrap complete"
