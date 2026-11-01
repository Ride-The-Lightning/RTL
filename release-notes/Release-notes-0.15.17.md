## Bug Fixes

- [#1796](https://github.com/Ride-The-Lightning/RTL/pull/1796) Fix LND routing CSV column order ([#1545](https://github.com/Ride-The-Lightning/RTL/issues/1545)). Columns no longer follow response object-key order; missing optional HTLC IDs produce empty cells, and extra fields remain in sorted trailing columns.
