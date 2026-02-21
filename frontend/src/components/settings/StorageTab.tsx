import { useState } from 'react';
import { RefreshCw, Trash2, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const StorageTab = () => {
    const [gcing, setGcing] = useState(false);
    const [gcOutput, setGcOutput] = useState('');

    const handleGC = async () => {
        if (!window.confirm("Run Garbage Collection? This will free up space from deleted images. It might take a few seconds.")) return;
        setGcing(true);
        setGcOutput('');
        try {
            const { data } = await api.post('/registry/gc');
            setGcOutput(JSON.stringify(data.output, null, 2));
            alert('Garbage Collection triggered successfully.');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to run GC');
        } finally {
            setGcing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Garbage Collection */}
            <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trash2 size={20} className="text-red-500" />
                    Garbage Collection
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                        Soft-deleted manifests are not automatically removed from the file system.
                        Run Garbage Collection to free up disk space by removing unreferenced blobs.
                        <b className="block mt-2 text-green-600 dark:text-green-400">
                            Note: This action is safe! It only removes data that is no longer referenced by any tag.
                        </b>
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleGC}
                            disabled={gcing}
                            className="w-fit flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={gcing ? 'animate-spin' : ''} />
                            {gcing ? 'Running Garbage Collection...' : 'Run Garbage Collection Now'}
                        </button>

                        {gcOutput && (
                            <div className="mt-4 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap max-h-60 border border-gray-700">
                                {gcOutput}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Retention Policies */}
            <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <HardDrive size={20} className="text-blue-500" />
                    Retention Policies
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Automated retention rules (e.g., maintain last 5 tags) are coming soon.
                    </p>
                </div>
            </section>
        </motion.div>
    );
};

export default StorageTab;
