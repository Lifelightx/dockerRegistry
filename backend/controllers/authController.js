const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

const dockerAuth = async (req, res) => {
    try {
        const { service, scope, offline_token, client_id } = req.query;
        let access = [];
        let user = null;

        // 1. Authenticate (Basic Auth)
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const match = authHeader.match(/^Basic (.+)$/);
            if (match) {
                const credentials = Buffer.from(match[1], 'base64').toString('utf-8').split(':');
                const username = credentials[0];
                const password = credentials[1];

                const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
                if (userResult.rows.length > 0) {
                    const dbUser = userResult.rows[0];
                    const validPassword = await bcrypt.compare(password, dbUser.password);
                    if (validPassword) {
                        user = dbUser;
                    } else {
                        return res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }] });
                    }
                } else {
                    return res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'User not found' }] });
                }
            }
        }

        // If no user and authentication is required for push, or if private repo (configured via anonymous access check).
        // For now, we allow public pull if implemented, but prompt says "Pull ❌ Anonymous".
        // So strict check: if !user, fail.
        if (!user) {
            return res.status(401).header('Www-Authenticate', `Bearer realm="http://${req.hostname}:${process.env.PORT || 6500}/api/auth",service="${service || 'registry'}"`).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }] });
        }

        // 2. Authorize Scope
        // Scope format: "repository:samalba/my-app:pull,push"
        // Can be multiple scopes? Express handles repetitive query params as array.
        const scopes = Array.isArray(scope) ? scope : (scope ? [scope] : []);

        for (const s of scopes) {
            const parts = s.split(':');
            if (parts.length === 3 && parts[0] === 'repository') {
                const name = parts[1];
                const requestedActions = parts[2].split(',');
                const allowedActions = [];

                for (const action of requestedActions) {
                    if (action === 'delete') continue; // Delete never allowed via Docker CLI token

                    if (user.role === 'admin') {
                        allowedActions.push(action);
                    } else {
                        // Check group permissions for non-admin users
                        try {
                            const groupPerms = await pool.query(`
                                SELECT permission FROM group_repositories gr
                                JOIN group_members gm ON gr.group_id = gm.group_id
                                WHERE gm.user_id = $1 AND gr.repository_name = $2
                            `, [user.id, name]);

                            let canPush = false;
                            let canPull = false;

                            for (let row of groupPerms.rows) {
                                if (row.permission === 'push_pull') { canPush = true; canPull = true; }
                                if (row.permission === 'push') canPush = true;
                                if (row.permission === 'pull') canPull = true;
                            }

                            if (action === 'push' && canPush) allowedActions.push(action);
                            if (action === 'pull' && canPull) allowedActions.push(action);
                        } catch (err) {
                            console.error('Group permission check failed:', err);
                        }
                    }
                }

                if (allowedActions.length > 0) {
                    access.push({
                        type: 'repository',
                        name: name,
                        actions: allowedActions
                    });

                    // Audit Log (Best effort for intent)
                    if (allowedActions.includes('push')) {
                        await pool.query(
                            "INSERT INTO registry_stats (username, action, repository) VALUES ($1, $2, $3)",
                            [user.username, 'push', name]
                        );
                    }
                    if (allowedActions.includes('pull')) {
                        await pool.query(
                            "INSERT INTO registry_stats (username, action, repository) VALUES ($1, $2, $3)",
                            [user.username, 'pull', name]
                        );
                    }
                }


            }
        }

        // 3. Generate Token
        // "offline_token" means a refresh token, but Registry v2 uses the generated token directly.

        const token = signToken(user.username, access);
        res.json({ token });

    } catch (err) {
        console.error('Auth Error:', err);
        res.status(500).json({ errors: [{ code: 'UNKNOWN', message: 'Internal Server Error' }] });
    }
};

module.exports = { dockerAuth };
