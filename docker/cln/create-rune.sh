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

RUNE_FILE="${LIGHTNINGD_DATA}/rtl.rune"

[ -f "${RUNE_FILE}" ] && exit 0

lightning-cli --network="${LIGHTNINGD_NETWORK}" getinfo >/dev/null 2>&1 || exit 1

rune=$(lightning-cli --network="${LIGHTNINGD_NETWORK}" createrune 2>/dev/null \
  | grep -o '"rune"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | sed -e 's/.*"rune"[[:space:]]*:[[:space:]]*"//' -e 's/"$//')

[ -n "${rune}" ] || exit 1

printf 'LIGHTNING_RUNE="%s"\n' "${rune}" > "${RUNE_FILE}"
