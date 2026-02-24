const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const secret = process.env.JWT_SECRET || 'your_jwt_secret';

        jwt.verify(token, secret, async (err, user) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });

            if (roles.length > 0 && !roles.includes(user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            // Fallback for older tokens lacking user.id
            if (!user.id && user.username) {
                try {
                    const result = await pool.query("SELECT id FROM users WHERE username = $1", [user.username]);
                    if (result.rows.length > 0) {
                        user.id = result.rows[0].id;
                    }
                } catch (dbErr) {
                    console.error("Error fetching user ID in auth middleware", dbErr);
                }
            }

            req.user = user;
            next();
        });
    };
};

module.exports = authenticateToken;
