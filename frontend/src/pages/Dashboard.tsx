import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Search, Box, Tag, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../components/ui/Pagination';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface Repository {
    name: string;
    tagsCount: number;
    tags: string[];
    pushCount: number;
    pullCount: number;
}

const Dashboard = () => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useNotification();

    const [repoToDelete, setRepoToDelete] = useState<string | null>(null);
    const [isDeletingRepo, setIsDeletingRepo] = useState(false);

    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        try {
            const { data } = await api.get<Repository[]>('/registry/repositories');
            setRepos(data);
        } catch (error) {
            console.error('Failed to fetch repos', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRepository = async () => {
        if (!repoToDelete) return;
        setIsDeletingRepo(true);
        try {
            await api.delete(`/registry/repositories/${encodeURIComponent(repoToDelete)}`);
            setRepos(repos.filter(r => r.name !== repoToDelete));
            success(`Successfully deleted repository ${repoToDelete}`);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to delete repository');
        } finally {
            setIsDeletingRepo(false);
            setRepoToDelete(null);
        }
    };

    const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    // Pagination logic
    const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);
    const paginatedRepos = filteredRepos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Repositories
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredRepos.length} repository{filteredRepos.length !== 1 ? 's' : ''} found
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Filter repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                                        <th className="px-6 py-4 w-[250px]">Repository Name</th>
                                        <th className="px-6 py-4 text-center">Tags</th>
                                        <th className="px-6 py-4 text-center">Pushes</th>
                                        <th className="px-6 py-4 text-center">Pulls</th>
                                        <th className="px-6 py-4">Recent Tags</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedRepos.map((repo) => (
                                        <motion.tr
                                            key={repo.name}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={() => navigate(`/repository/${encodeURIComponent(repo.name)}`)}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                        <Box size={20} />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{repo.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                                    {repo.tagsCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    {repo.pushCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {repo.pullCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {repo.tags && repo.tags.length > 0 ? (
                                                        repo.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                                <Tag size={10} />
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No tags</span>
                                                    )}
                                                    {repo.tagsCount > 3 && (
                                                        <span className="text-xs text-gray-400 py-1">+ {repo.tagsCount - 3} more</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRepoToDelete(repo.name); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors ml-auto"
                                                        title="Delete Repository"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {filteredRepos.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No repositories found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredRepos.length}
                            itemsPerPage={itemsPerPage}
                        />

                        <ConfirmModal
                            isOpen={!!repoToDelete}
                            title="Delete Repository"
                            message={`Are you sure you want to delete the repository "${repoToDelete}"? This will permanently delete ALL tags and layers associated with this image. This action cannot be undone.`}
                            onConfirm={deleteRepository}
                            onClose={() => setRepoToDelete(null)}
                            isLoading={isDeletingRepo}
                            confirmText="Delete Repository"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
