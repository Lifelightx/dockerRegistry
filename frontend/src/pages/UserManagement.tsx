import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Shield, User, Loader2, Pencil, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useNotification } from '../context/NotificationContext';
import Pagination from '../components/ui/Pagination';

interface UserData {
    id: number;
    username: string;
    role: 'admin' | 'maintainer' | 'user';
    created_at: string;
}

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { success, error: showError } = useNotification();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get<UserData[]>('/users');
            setUsers(data);
        } catch (error) {
            showError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUser) {
                // Update existing user
                await api.put(`/users/${editingUser.id}`, {
                    role: formData.role,
                    ...(formData.password ? { password: formData.password } : {})
                });
                success(`Successfully updated user ${formData.username}`);
            } else {
                // Create new user
                await api.post('/users', formData);
                success(`Successfully created user ${formData.username}`);
            }
            setShowModal(false);
            setFormData({ username: '', password: '', role: 'user' });
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            showError(error.response?.data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'user' });
        setShowPassword(false);
        setShowModal(true);
    };

    const openEditModal = (user: UserData) => {
        setEditingUser(user);
        setFormData({ username: user.username, password: '', role: user.role });
        setShowPassword(false);
        setShowModal(true);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/users/${userToDelete.id}`);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            success(`Successfully deleted user ${userToDelete.username}`);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const totalPages = Math.ceil(users.length / itemsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage access and roles</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    >
                        <UserPlus size={18} />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedUsers.map((user) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                                            <User size={18} />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                            user.role === 'maintainer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {user.role === 'admin' && <Shield size={10} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit User"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => setUserToDelete(user)}
                                            disabled={currentUser?.username === user.username}
                                            className={`p-2 rounded-lg transition-colors ${currentUser?.username === user.username
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                            title={currentUser?.username === user.username ? "Cannot delete yourself" : "Delete User"}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={users.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden z-10"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {editingUser ? <Pencil className="text-blue-500" size={20} /> : <UserPlus className="text-blue-500" size={20} />}
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingUser}
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-4 pr-11 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="user">User</option>
                                        <option value="maintainer">Maintainer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2"
                                    >
                                        {submitting && <Loader2 className="animate-spin" size={16} />}
                                        {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={executeDelete}
                title="Delete User"
                message={<>Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{userToDelete?.username}</span>? This action cannot be undone and they will lose access to the registry.</>}
                confirmText="Delete User"
                icon={Trash2}
                isDestructive={true}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UserManagement;
