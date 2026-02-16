CREATE TABLE IF NOT EXISTS scan_entry (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(1024),
    km_stand INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_entry_timestamp ON scan_entry (timestamp);
