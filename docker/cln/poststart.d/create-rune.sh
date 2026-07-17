#!/usr/bin/env bash
#
# Runs from Core Lightning's lightning-poststart.d. Creates a master rune (once)
# and stores it in the format RTL expects: a file containing
#   LIGHTNING_RUNE="<rune>"
# which RTL reads via its runePath.
#
# The image entrypoint can invoke poststart scripts before the RPC socket is
# ready (it watches the datadir with a race that loses on a fresh node), so poll
# for `getinfo` before calling createrune. Idempotent: keeps the same rune across
# restarts so RTL's stored auth stays valid.

RUNE_FILE="${LIGHTNINGD_DATA}/rtl.rune"

[ -f "${RUNE_FILE}" ] && exit 0

# Wait (up to ~120s) for the RPC to accept commands.
for _ in $(seq 1 120); do
  if lightning-cli --network="${LIGHTNINGD_NETWORK}" getinfo >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

rune=$(lightning-cli --network="${LIGHTNINGD_NETWORK}" createrune 2>/dev/null \
  | grep -o '"rune"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | sed -e 's/.*"rune"[[:space:]]*:[[:space:]]*"//' -e 's/"$//')

if [ -z "${rune}" ]; then
  echo "create-rune.sh: failed to create rune" >&2
  exit 1
fi

printf 'LIGHTNING_RUNE="%s"\n' "${rune}" > "${RUNE_FILE}"
echo "create-rune.sh: wrote rune to ${RUNE_FILE}"
