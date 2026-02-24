const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";
const initDb = async () => {
    try {
        const sqlPath = path.join(__dirname, '../config/migrations/createUsers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration createUsers...');
        await pool.query(sql);

        const groupsSqlPath = path.join(__dirname, '../config/migrations/createGroups.sql');
        const groupsSql = fs.readFileSync(groupsSqlPath, 'utf8');

        console.log('Running migration createGroups...');
        await pool.query(groupsSql);

        const statsSqlPath = path.join(__dirname, '../config/migrations/createStats.sql');
        const statsSql = fs.readFileSync(statsSqlPath, 'utf8');

        console.log('Running migration createStats...');
        await pool.query(statsSql);

        const retentionSqlPath = path.join(__dirname, '../config/migrations/createRetentionPolicies.sql');
        const retentionSql = fs.readFileSync(retentionSqlPath, 'utf8');

        console.log('Running migration createRetentionPolicies...');
        await pool.query(retentionSql);

        const notifSettingsSqlPath = path.join(__dirname, '../config/migrations/createNotificationSettings.sql');
        const notifSettingsSql = fs.readFileSync(notifSettingsSqlPath, 'utf8');

        console.log('Running migration createNotificationSettings...');
        await pool.query(notifSettingsSql);

        console.log('Migrations completed.');

        // Seed Admin User
        const adminHash = await bcrypt.hash(password, 10);
        const checkAdmin = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (checkAdmin.rows.length === 0) {
            await pool.query(
                "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
                [username, adminHash, 'admin']
            );
            console.log('Default admin user created.');
        } else {
            console.log('Admin user already exists.');
        }

        // process.exit(0); // Do not exit, let the app start
    } catch (err) {
        console.error('Error initializing DB:', err);
        // process.exit(1);
        throw err;
    }
};

module.exports = initDb;
