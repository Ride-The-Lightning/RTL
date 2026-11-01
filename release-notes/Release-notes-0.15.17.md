## Bug Fixes

- LND routing CSV exports keep a fixed order for known columns across selected dates and LND versions. Missing optional HTLC IDs produce empty cells; additional fields are retained in sorted trailing columns. Existing CSV escaping and other exports are unchanged.
