#!/bin/sh
# Called by Certbot after renewal; install outside the application checkout.
set -eu
: "${CYLOO_DOMAIN:?Set the hostname managed by this hook}"
: "${RENEWED_LINEAGE:?Certbot must supply the certificate lineage}"
case " ${RENEWED_DOMAINS:-} " in
  *" $CYLOO_DOMAIN "*) ;;
  *) exit 0 ;;
esac
certs=${CYLOO_CERTS_DIR:-/opt/cyloo/shared/certs}
proxy=${CYLOO_PROXY_CONTAINER:-cyloo-crm-proxy-1}
test -d "$certs"
openssl x509 -in "$RENEWED_LINEAGE/fullchain.pem" -noout -checkend 86400 >/dev/null
openssl pkey -in "$RENEWED_LINEAGE/privkey.pem" -check -noout >/dev/null
install -m 644 "$RENEWED_LINEAGE/fullchain.pem" "$certs/fullchain.pem.next"
install -m 600 "$RENEWED_LINEAGE/privkey.pem" "$certs/privkey.pem.next"
mv -f "$certs/fullchain.pem.next" "$certs/fullchain.pem"
mv -f "$certs/privkey.pem.next" "$certs/privkey.pem"
docker exec "$proxy" nginx -t
docker exec "$proxy" nginx -s reload
