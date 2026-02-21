-- noinspection SqlNoDataSourceInspection,SqlDialectInspection
CREATE TABLE IF NOT EXISTS drive_template (
    id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    drive_length INTEGER NOT NULL,
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    reason INTEGER,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_drive_template_name ON drive_template (name);

CREATE TABLE IF NOT EXISTS drive (
    id VARCHAR(255) NOT NULL,
    template_id VARCHAR(255),
    date DATE,
    reason INTEGER,
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    drive_length INTEGER,
    PRIMARY KEY (id),
    CONSTRAINT fk_drive_template FOREIGN KEY (template_id) REFERENCES drive_template (id)
);

CREATE TABLE IF NOT EXISTS scan_entry (
    id VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(1024),
    km_stand INTEGER,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_scan_entry_timestamp ON scan_entry (timestamp);
