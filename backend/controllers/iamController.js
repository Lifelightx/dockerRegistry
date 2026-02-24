const pool = require('../config/db');

// Helper to check if user has admin rights over a specific group
const checkGroupAdmin = async (userId, userRole, groupId) => {
    if (userRole === 'admin') return true;

    const result = await pool.query(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        [groupId, userId]
    );

    return result.rows.length > 0 && result.rows[0].role === 'admin';
};

const getGroups = async (req, res) => {
    try {
        let query;
        let params = [];
        if (req.user.role === 'admin') {
            query = "SELECT * FROM groups ORDER BY created_at DESC";
        } else {
            query = `
                SELECT g.*, gm.role as user_group_role
                FROM groups g
                JOIN group_members gm ON g.id = gm.group_id
                WHERE gm.user_id = $1
                ORDER BY g.created_at DESC
            `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);

        // Enhance with member count and repository count
        const groups = result.rows;
        for (let group of groups) {
            const memberCount = await pool.query("SELECT COUNT(*) FROM group_members WHERE group_id = $1", [group.id]);
            group.memberCount = parseInt(memberCount.rows[0].count);

            const repoCount = await pool.query("SELECT COUNT(*) FROM group_repositories WHERE group_id = $1", [group.id]);
            group.repoCount = parseInt(repoCount.rows[0].count);
        }

        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch groups' });
    }
};

const createGroup = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const { name, description } = req.body;
        const result = await pool.query(
            "INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.constraint === 'groups_name_key') {
            return res.status(400).json({ message: 'Group name already exists' });
        }
        res.status(500).json({ message: 'Failed to create group' });
    }
};

const deleteGroup = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const { id } = req.params;
        await pool.query("DELETE FROM groups WHERE id = $1", [id]);
        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete group' });
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT u.id, u.username, u.role as system_role, gm.role as group_role, gm.created_at
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = $1
            ORDER BY u.username ASC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch group members' });
    }
};

const addGroupMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role = 'member' } = req.body;

        const hasAccess = await checkGroupAdmin(req.user.id, req.user.role, id);
        if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)",
            [id, userId, role]
        );
        res.status(201).json({ message: 'Member added successfully' });
    } catch (err) {
        console.error(err);
        if (err.constraint === 'group_members_pkey') {
            return res.status(400).json({ message: 'User is already a member of this group' });
        }
        res.status(500).json({ message: 'Failed to add member' });
    }
};

const updateGroupMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body;

        const hasAccess = await checkGroupAdmin(req.user.id, req.user.role, id);
        if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            "UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3",
            [role, id, userId]
        );
        res.json({ message: 'Member role updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update member role' });
    }
};

const removeGroupMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const hasAccess = await checkGroupAdmin(req.user.id, req.user.role, id);
        if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
            [id, userId]
        );
        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};

const getGroupRepositories = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT repository_name, permission, created_at FROM group_repositories WHERE group_id = $1 ORDER BY repository_name ASC",
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch group repositories' });
    }
};

const addGroupRepository = async (req, res) => {
    try {
        const { id } = req.params;
        const { repositoryName, permission } = req.body;

        const hasAccess = await checkGroupAdmin(req.user.id, req.user.role, id);
        if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            "INSERT INTO group_repositories (group_id, repository_name, permission) VALUES ($1, $2, $3) ON CONFLICT (group_id, repository_name) DO UPDATE SET permission = EXCLUDED.permission",
            [id, repositoryName, permission]
        );
        res.status(201).json({ message: 'Repository added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add repository' });
    }
};

const removeGroupRepository = async (req, res) => {
    try {
        const { id, repoName } = req.params;

        const hasAccess = await checkGroupAdmin(req.user.id, req.user.role, id);
        if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            "DELETE FROM group_repositories WHERE group_id = $1 AND repository_name = $2",
            [id, repoName]
        );
        res.json({ message: 'Repository removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to remove repository' });
    }
};

module.exports = {
    getGroups,
    createGroup,
    deleteGroup,
    getGroupMembers,
    addGroupMember,
    updateGroupMemberRole,
    removeGroupMember,
    getGroupRepositories,
    addGroupRepository,
    removeGroupRepository
};
