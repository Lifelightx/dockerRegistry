CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'maintainer', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    repository VARCHAR(255),
    tag VARCHAR(255),
    digest VARCHAR(255),
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vulnerability_scans (
    id SERIAL PRIMARY KEY,
    repository VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NOT NULL,
    digest VARCHAR(255),
    severity_summary JSONB DEFAULT '{}',
    vulnerabilities JSONB DEFAULT '[]',
    scan_status VARCHAR(50) DEFAULT 'pending',
    last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(repository, tag)
);
