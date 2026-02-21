const pool = require('../config/db');

exports.getNotificationSettings = async (req, res) => {
    try {
        const result = await pool.query("SELECT config FROM notification_settings ORDER BY id DESC LIMIT 1");
        if (result.rows.length === 0) {
            return res.json({});
        }
        res.json(result.rows[0].config);
    } catch (error) {
        console.error("Failed to get notification settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateNotificationSettings = async (req, res) => {
    try {
        const newConfig = req.body;

        // Ensure table has at least one row, or insert
        const existing = await pool.query("SELECT id FROM notification_settings ORDER BY id DESC LIMIT 1");
        if (existing.rows.length === 0) {
            await pool.query("INSERT INTO notification_settings (config) VALUES ($1)", [newConfig]);
        } else {
            const id = existing.rows[0].id;
            await pool.query("UPDATE notification_settings SET config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newConfig, id]);
        }

        res.json({ message: "Settings updated successfully" });
    } catch (error) {
        console.error("Failed to update notification settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
