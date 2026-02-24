import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Users, Trash2, Folder } from 'lucide-react';
import api from '../../lib/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Pagination from '../ui/Pagination';

export interface Group {
    id: number;
    name: string;
    description: string;
    created_at: string;
    memberCount: number;
    repoCount: number;
    user_group_role?: string;
}

const GroupsTab = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const { success, error: showError } = useNotification();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const { data } = await api.get<Group[]>('/iam/groups');
            setGroups(data);
        } catch (error) {
            showError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/iam/groups', { name: newGroupName, description: newGroupDesc });
            success(`Group ${newGroupName} created successfully`);
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchGroups();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to create group');
        }
    };

    const handleDeleteGroup = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete the group "${name}"?`)) return;

        try {
            await api.delete(`/iam/groups/${id}`);
            success(`Group deleted successfully`);
            setGroups(groups.filter(g => g.id !== id));
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete group');
        }
    };

    const totalPages = Math.ceil(groups.length / itemsPerPage);
    const paginatedGroups = groups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Groups</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage user groups and repository access</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <Plus size={18} />
                        Create Group
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                                <th className="px-6 py-4">Group</th>
                                <th className="px-6 py-4">Members</th>
                                <th className="px-6 py-4">Repositories</th>
                                <th className="px-6 py-4">Created Date</th>
                                {user?.role === 'admin' && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">Loading Groups...</td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">No groups found.</td>
                                </tr>
                            ) : (
                                paginatedGroups.map((group) => (
                                    <tr
                                        key={group.id}
                                        onClick={() => navigate(`/admin/groups/${group.id}`)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group/row"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px] truncate" title={group.description}>
                                                        {group.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <Users size={16} className="text-gray-400" />
                                                {group.memberCount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <Folder size={16} className="text-gray-400" />
                                                {group.repoCount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(group.created_at).toLocaleDateString()}
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Group"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={groups.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800"
                    >
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create New Group</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white transition-all"
                                    placeholder="e.g., DevOps Team"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <textarea
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white transition-all resize-none"
                                    placeholder="Group responsibilities..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default GroupsTab;
