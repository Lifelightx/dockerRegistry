const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!['admin', 'maintainer', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
            [username, hashedPassword, role]
        );
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        // Note: We need to fetch the user ID from the username in the token first, or store ID in token
        // For now, let's fetch the user by username from the token
        const requester = await pool.query("SELECT id FROM users WHERE username = $1", [req.user.username]);
        if (requester.rows.length > 0 && requester.rows[0].id === parseInt(id)) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, password } = req.body;

        if (role && !['admin', 'maintainer', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (role) {
            updates.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password = $${paramIndex}`);
            values.push(hashedPassword);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.json({ message: 'No changes made' });
        }

        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

        await pool.query(query, values);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, role, created_at FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, createUser, deleteUser, getUsers, updateUser };
