import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Loader2, Activity } from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const RecentActivities = () => {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const { data } = await api.get('/registry/statistics');
            setActivities(data.recentActivity || []);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(activities.length / itemsPerPage);
    const paginatedActivities = activities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Recent Activities
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View all recent interactions with the registry
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedActivities.map((activity, i) => (
                            <div key={i} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className={`p-1.5 rounded-full ${activity.action === 'push' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {activity.action === 'push' ? <Loader2 size={16} className="rotate-180" /> : <Loader2 size={16} />}
                                </div>
                                <div className="flex-1 flex items-center">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                <span className="capitalize">{activity.action}</span> by <span className="font-bold">{activity.username}</span>
                                            </p>
                                            <span className="hidden sm:inline text-gray-300 dark:text-gray-700 -mx-1">•</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="hidden sm:inline">Repository: </span><span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs text-gray-600 dark:text-gray-300">{activity.repository}</span>
                                            </p>
                                            {activity.tag && (
                                                <>
                                                    <span className="hidden sm:inline text-gray-300 dark:text-gray-700 -mx-1">•</span>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="hidden sm:inline">Tag: </span><span className="font-mono text-xs">{activity.tag}</span>
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap pl-4 border-l border-gray-100 dark:border-gray-800 ml-2">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={activities.length}
                        itemsPerPage={itemsPerPage}
                    />
                </div>
            )}
        </div>
    );
};

export default RecentActivities;
