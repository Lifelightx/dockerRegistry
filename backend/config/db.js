const pg = require('pg');

const pool = new pg.Pool({
    user: process.env.DB_USER || 'registry',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'registry',
    password: process.env.DB_PASS || 'registry123',
    port: process.env.DB_PORT || 5432,
});

module.exports = pool;