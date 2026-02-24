import { useState, useEffect } from 'react';
import { UserPlus, FolderPlus, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { Group } from '../components/iam/GroupsTab';

interface Member {
    id: number;
    username: string;
    system_role: string;
    group_role: string;
    created_at: string;
}

interface RepositoryAccess {
    repository_name: string;
    permission: 'pull' | 'push' | 'push_pull';
    created_at: string;
}

const GroupDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState<'members' | 'repositories'>('members');

    // State
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [repositories, setRepositories] = useState<RepositoryAccess[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allRepos, setAllRepos] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [addingMember, setAddingMember] = useState(false);
    const [addingRepo, setAddingRepo] = useState(false);

    // Form State
    const [newMemberId, setNewMemberId] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('member');
    const [newRepoName, setNewRepoName] = useState('');
    const [newRepoPermission, setNewRepoPermission] = useState('pull');

    // Permissions
    const isGroupAdmin = user?.role === 'admin' || group?.user_group_role === 'admin';

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // First fetch the groups to get this specific group's info
            const groupsRes = await api.get<Group[]>('/iam/groups');
            const foundGroup = groupsRes.data.find(g => g.id === parseInt(id!));
            if (foundGroup) {
                setGroup(foundGroup);
            } else {
                showError("Group not found");
                navigate('/admin/users');
                return;
            }

            const [membersRes, reposRes] = await Promise.all([
                api.get<Member[]>(`/iam/groups/${id}/members`),
                api.get<RepositoryAccess[]>(`/iam/groups/${id}/repositories`)
            ]);

            setMembers(membersRes.data);
            setRepositories(reposRes.data);

            // Only admins or properly authorized users can fetch all repos globally.
            // Wrap in try-catch so it doesn't break the entire page load for members
            try {
                const usersRes = await api.get('/users');
                const allReposRes = await api.get('/registry/repositories');
                setAllUsers(usersRes.data);
                setAllRepos(Array.isArray(allReposRes.data) ? allReposRes.data : []);
            } catch (authErr) {
                console.log("Not authorized to fetch global users/repos", authErr);
            }
        } catch (error) {
            console.error("Failed to fetch group details", error);
            showError("Failed to load group details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberId || !group) return;
        try {
            await api.post(`/iam/groups/${group.id}/members`, {
                userId: parseInt(newMemberId),
                role: newMemberRole
            });
            success('Member added successfully');
            setAddingMember(false);
            setNewMemberId('');
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!window.confirm('Remove this user from the group?') || !group) return;
        try {
            await api.delete(`/iam/groups/${group.id}/members/${userId}`);
            success('Member removed');
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleUpdateMemberRole = async (userId: number, role: string) => {
        if (!group) return;
        try {
            await api.put(`/iam/groups/${group.id}/members/${userId}`, { role });
            success('Member role updated');
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleAddRepo = async () => {
        if (!newRepoName || !group) return;
        try {
            await api.post(`/iam/groups/${group.id}/repositories`, {
                repositoryName: newRepoName,
                permission: newRepoPermission
            });
            success('Repository access granted');
            setAddingRepo(false);
            setNewRepoName('');
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to grant access');
        }
    };

    const handleRemoveRepo = async (repoName: string) => {
        if (!window.confirm('Remove access to this repository?') || !group) return;
        try {
            await api.delete(`/iam/groups/${group.id}/repositories/${repoName}`);
            success('Access revoked');
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to revoke access');
        }
    };

    const unassignedUsers = allUsers.filter(u => !members.find(m => m.id === u.id));
    const unassignedRepos = allRepos.filter(r => !repositories.find(ar => ar.repository_name === r.name));

    if (loading || !group) {
        return <div className="flex justify-center py-20 text-gray-500">Loading details...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/admin/users?tab=groups')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Groups
            </button>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col min-h-[60vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{group.description || 'No description'}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 pt-4">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Members ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('repositories')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'repositories' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Repositories ({repositories.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-500">Loading details...</div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'members' ? (
                                <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {isGroupAdmin && (
                                        <div className="flex justify-end mb-4">
                                            <button onClick={() => setAddingMember(!addingMember)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                                <UserPlus size={16} /> Add Member
                                            </button>
                                        </div>
                                    )}

                                    {addingMember && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-end gap-4 mb-6">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select User</label>
                                                <select
                                                    value={newMemberId}
                                                    onChange={(e) => setNewMemberId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                                >
                                                    <option value="">-- Select a User --</option>
                                                    {unassignedUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-48">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Group Role</label>
                                                <select
                                                    value={newMemberRole}
                                                    onChange={(e) => setNewMemberRole(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Group Admin</option>
                                                </select>
                                            </div>
                                            <button onClick={handleAddMember} disabled={!newMemberId} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                                                Confirm
                                            </button>
                                            <button onClick={() => setAddingMember(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <th className="px-6 py-3">Username</th>
                                                    <th className="px-6 py-3">System Role</th>
                                                    <th className="px-6 py-3">Group Role</th>
                                                    {isGroupAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {members.map(member => (
                                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.username}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded text-xs tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                                {member.system_role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isGroupAdmin ? (
                                                                <select
                                                                    value={member.group_role}
                                                                    onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                                                    disabled={member.id === (user as any)?.id} // Don't allow self-demotion easily
                                                                    className="text-sm border-gray-300 dark:border-gray-600 rounded bg-transparent dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                                >
                                                                    <option value="member">Member</option>
                                                                    <option value="admin">Group Admin</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`px-2 py-1 rounded text-xs tracking-wide ${member.group_role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                    {member.group_role}
                                                                </span>
                                                            )}
                                                        </td>
                                                        {isGroupAdmin && (
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                    title="Remove from group"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                {members.length === 0 && (
                                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No members assigned to this group.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="repos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {isGroupAdmin && (
                                        <div className="flex justify-end mb-4">
                                            <button onClick={() => setAddingRepo(!addingRepo)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                                <FolderPlus size={16} /> Grant Access
                                            </button>
                                        </div>
                                    )}

                                    {addingRepo && (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-end gap-4 mb-6">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Repository</label>
                                                {allRepos.length > 0 ? (
                                                    <select
                                                        value={newRepoName}
                                                        onChange={(e) => setNewRepoName(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                                    >
                                                        <option value="">-- Select Repository --</option>
                                                        {unassignedRepos.map(r => (
                                                            <option key={r.name} value={r.name}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newRepoName}
                                                        onChange={(e) => setNewRepoName(e.target.value)}
                                                        placeholder="Type repository name..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                                    />
                                                )}
                                            </div>
                                            <div className="w-48">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permissions</label>
                                                <select
                                                    value={newRepoPermission}
                                                    onChange={(e) => setNewRepoPermission(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                                >
                                                    <option value="pull">Pull Only</option>
                                                    <option value="push">Push Only</option>
                                                    <option value="push_pull">Push & Pull</option>
                                                </select>
                                            </div>
                                            <button onClick={handleAddRepo} disabled={!newRepoName} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                                                Grant
                                            </button>
                                            <button onClick={() => setAddingRepo(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    <th className="px-6 py-3">Repository</th>
                                                    <th className="px-6 py-3">Permissions</th>
                                                    <th className="px-6 py-3">Granted On</th>
                                                    {isGroupAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {repositories.map(repo => (
                                                    <tr key={repo.repository_name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{repo.repository_name}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 rounded text-xs tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                                {repo.permission.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(repo.created_at).toLocaleDateString()}
                                                        </td>
                                                        {isGroupAdmin && (
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleRemoveRepo(repo.repository_name)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                    title="Revoke access"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                {repositories.length === 0 && (
                                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No repositories granted to this group.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupDetails;
