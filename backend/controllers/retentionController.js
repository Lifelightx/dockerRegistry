const pool = require('../config/db');
const axios = require('axios');

exports.getPolicy = async (req, res) => {
    try {
        const repo = req.params.repo || 'global';
        const result = await pool.query(
            "SELECT * FROM retention_policies WHERE repository = $1",
            [repo]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json({ repository: repo, keep_n: 5 }); // Default policy
        }
    } catch (err) {
        console.error('Error fetching retention policy:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.setPolicy = async (req, res) => {
    try {
        const repo = req.params.repo || 'global';
        const { keep_n } = req.body;

        if (keep_n === undefined || keep_n < 1) {
            return res.status(400).json({ error: 'keep_n must be a positive integer' });
        }

        const result = await pool.query(
            `INSERT INTO retention_policies (repository, keep_n, updated_at) 
             VALUES ($1, $2, CURRENT_TIMESTAMP) 
             ON CONFLICT (repository) 
             DO UPDATE SET keep_n = $2, updated_at = CURRENT_TIMESTAMP 
             RETURNING *`,
            [repo, keep_n]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error setting retention policy:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.executePolicies = async (req, res) => {
    try {
        // Trigger thecron job logic manually
        const cron = require('../scripts/cron');
        await cron.runRetentionCleanup();
        res.json({ message: 'Retention cleanup executed successfully' });
    } catch (err) {
        console.error('Error executing retention policies:', err);
        res.status(500).json({ error: 'Failed to execute retention policies' });
    }
};
