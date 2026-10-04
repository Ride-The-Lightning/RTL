#!/bin/sh
# Starts eclair-node with every --key=value argument passed on as -Declair.key=value.
#
# Eclair announces server.public-ips in its node announcement, and LND fails to parse
# an announcement that carries a DNS hostname. So the hostname given for
# --server.public-ips.0 is replaced with this container's IP address.
set -eu

for arg in "$@"; do
  shift
  case "$arg" in
    --server.public-ips.0=*) set -- "$@" "-Declair.server.public-ips.0=$(hostname -i | cut -d' ' -f1)" ;;
    --*) set -- "$@" "-Declair.${arg#--}" ;;
    *) set -- "$@" "$arg" ;;
  esac
done

exec /opt/eclair/bin/eclair-node.sh "$@"
