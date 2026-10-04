# bitcoind for the regtest fixture, from Bitcoin Core's official release binaries.
#
# Polar publishes nothing newer than bitcoind 30.0, and Eclair 0.14.1+ needs 31.x.
# The tarball is checked against the SHA-256 below, copied from the release's
# SHA256SUMS. To bump: download SHA256SUMS and SHA256SUMS.asc from
# https://bitcoincore.org/bin/bitcoin-core-<version>/, verify the signatures
# against https://github.com/bitcoin-core/guix.sigs/tree/main/builder-keys, then
# update the version and both hashes. 31.1: 11 good builder signatures, 0 bad.

FROM debian:bookworm-slim

ARG BITCOIN_VERSION=31.1
ARG SHA256_X86_64=b80d9c3e04da78fb6f0569685673418cf686fadba9042d926d13fb87ff503f9e
ARG SHA256_AARCH64=dcf1873f2208ba4f962f3398d47e154c39c0084be8f4553e05c940d0ace3d004
ARG TARGETARCH

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl; \
    case "$TARGETARCH" in \
      amd64) arch=x86_64; sha="$SHA256_X86_64" ;; \
      arm64) arch=aarch64; sha="$SHA256_AARCH64" ;; \
      *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    tarball="bitcoin-${BITCOIN_VERSION}-${arch}-linux-gnu.tar.gz"; \
    curl -fsSLo "/tmp/$tarball" "https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/$tarball"; \
    echo "$sha  /tmp/$tarball" | sha256sum -c -; \
    tar -xzf "/tmp/$tarball" -C /tmp; \
    install -m 0755 "/tmp/bitcoin-${BITCOIN_VERSION}/bin/bitcoind" "/tmp/bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli" /usr/local/bin/; \
    rm -rf /tmp/*; \
    apt-get purge -y curl; \
    apt-get autoremove -y; \
    rm -rf /var/lib/apt/lists/*

# uid/gid 1000 and /home/bitcoin/.bitcoin match the Polar image this replaces, so
# an existing bitcoind_data volume keeps working.
RUN groupadd -g 1000 bitcoin \
 && useradd -m -u 1000 -g bitcoin bitcoin \
 && mkdir -p /home/bitcoin/.bitcoin \
 && chown -R bitcoin:bitcoin /home/bitcoin

USER bitcoin
CMD ["bitcoind"]
