# Eclair for the regtest fixture, from ACINQ's official release artifact.
#
# acinq/eclair on Docker Hub is amd64-only with no current versioned tag, and Polar
# publishes nothing newer than 0.13.1. Eclair is JVM bytecode, so the release's
# eclair-node zip runs unchanged on amd64 and arm64 on a multi-arch JRE.
#
# The zip is checked against the SHA-256 below, copied from the release's
# SHA256SUMS.asc. To bump: download it from https://github.com/ACINQ/eclair/releases,
# verify it with ACINQ's documented release key E04E48E72C205463
# (https://acinq.co/pgp/drouinf2.asc), then update the version, commit and hash.
# v0.14.3 was signed with a different key, so this stays on 0.14.2 for now.

FROM eclipse-temurin:21-jre-noble

ARG ECLAIR_VERSION=0.14.2
ARG ECLAIR_COMMIT=3dd8d2d
ARG ECLAIR_SHA256=5166d081e825932b936c75d24c7e71128893f7fe3939e0747c4eeb935a1685aa

# curl and jq are runtime dependencies of eclair-cli.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl jq unzip; \
    zip="eclair-node-${ECLAIR_VERSION}-${ECLAIR_COMMIT}-bin.zip"; \
    curl -fsSLo "/tmp/$zip" "https://github.com/ACINQ/eclair/releases/download/v${ECLAIR_VERSION}/$zip"; \
    echo "$ECLAIR_SHA256  /tmp/$zip" | sha256sum -c -; \
    unzip -q "/tmp/$zip" -d /opt; \
    mv "/opt/eclair-node-${ECLAIR_VERSION}-${ECLAIR_COMMIT}" /opt/eclair; \
    ln -s /opt/eclair/bin/eclair-cli /usr/local/bin/eclair-cli; \
    rm -f "/tmp/$zip"; \
    apt-get purge -y unzip; \
    apt-get autoremove -y; \
    rm -rf /var/lib/apt/lists/*

# The base image ships an 'ubuntu' user at uid 1000 (with sudo/adm groups); replace it.
# uid/gid 1000 and /home/eclair match the Polar image this replaces, so an existing
# eclair_data volume keeps working.
RUN userdel -r ubuntu \
 && groupadd -g 1000 eclair \
 && useradd -m -u 1000 -g eclair -d /home/eclair eclair \
 && mkdir -p /home/eclair/.eclair \
 && chown -R eclair:eclair /home/eclair

COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh

USER eclair
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
