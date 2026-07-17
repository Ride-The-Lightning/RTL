#!/usr/bin/env bash
#
# Ensure the RTL rune exists. One quick, idempotent attempt:
#   - already have it            -> succeed
#   - RPC up, createrune works   -> write it, succeed
#   - RPC not ready / failure    -> fail, so the caller retries
#
# This is invoked from the cln healthcheck (not a one-shot poststart hook) so a
# transient RPC-startup race self-heals on the next healthcheck tick instead of
# permanently wedging the stack. Stores the rune as LIGHTNING_RUNE="<rune>", the
# format RTL reads via its runePath. POSIX sh compatible.
set -u

# Hardcoded to match the single source of truth used everywhere else in the fixture:
# the cln volume mount (cln_data:/root/.lightning), the healthcheck's `test -f`, and
# RTL's runePath (/cln/rtl.rune, /cln being cln_data mounted read-only). Keep these in
# lockstep — do not switch to ${LIGHTNINGD_DATA}, which would silently diverge if the
# image's data dir ever changed while the mounts/healthcheck stayed on /root/.lightning.
RUNE_FILE="/root/.lightning/rtl.rune"

[ -f "${RUNE_FILE}" ] && exit 0

lightning-cli --network="${LIGHTNINGD_NETWORK}" getinfo >/dev/null 2>&1 || exit 1

rune=$(lightning-cli --network="${LIGHTNINGD_NETWORK}" createrune 2>/dev/null \
  | grep -o '"rune"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | sed -e 's/.*"rune"[[:space:]]*:[[:space:]]*"//' -e 's/"$//')

[ -n "${rune}" ] || exit 1

printf 'LIGHTNING_RUNE="%s"\n' "${rune}" > "${RUNE_FILE}"
