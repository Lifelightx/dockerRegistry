import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, HardDrive, Save, Play, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';
import { useNotification } from '../../context/NotificationContext';

const StorageTab = () => {
    const [gcing, setGcing] = useState(false);
    const [gcOutput, setGcOutput] = useState('');
    const [showGCModal, setShowGCModal] = useState(false);

    // Retention Policy State
    const [repositories, setRepositories] = useState<string[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('global');
    const [keepN, setKeepN] = useState<number | ''>(5);
    const [savingPolicy, setSavingPolicy] = useState(false);
    const [runningPolicy, setRunningPolicy] = useState(false);
    const { success, error: showError } = useNotification();
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    useEffect(() => {
        // Fetch repositories for the dropdown
        api.get('/registry/repositories')
            .then(({ data }) => setRepositories((data.repositories || data || []).map((r: any) => r.name || r)))
            .catch(() => console.error('Failed to load repositories'));
    }, []);

    useEffect(() => {
        // Fetch policy when repo changes
        api.get(`/registry/retention/${encodeURIComponent(selectedRepo)}`)
            .then(({ data }) => setKeepN(data.keep_n))
            .catch(() => setKeepN(5)); // Default if not found
    }, [selectedRepo]);

    const executeGC = async () => {
        setGcing(true);
        setGcOutput('');
        try {
            const { data } = await api.post('/registry/gc');
            setGcOutput(JSON.stringify(data.output, null, 2));
            success('Garbage Collection triggered successfully.');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to run GC');
        } finally {
            setGcing(false);
        }
    };

    const handleSavePolicy = async () => {
        if (!keepN || keepN < 1) {
            showError('Please enter a valid number (greater than 0).');
            return;
        }
        setSavingPolicy(true);
        try {
            await api.post(`/registry/retention/${encodeURIComponent(selectedRepo)}`, { keep_n: Number(keepN) });
            success('Policy saved successfully.');
        } catch (error: any) {
            showError(error.response?.data?.error || 'Failed to save policy.');
        } finally {
            setSavingPolicy(false);
        }
    };

    const executeRunPolicies = async () => {
        setRunningPolicy(true);
        try {
            await api.post('/registry/retention/execute');
            success('Retention cleanup executed successfully.');
        } catch (error: any) {
            showError(error.response?.data?.error || 'Failed to execute policies.');
        } finally {
            setRunningPolicy(false);
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
                            onClick={() => setShowGCModal(true)}
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
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        Configure retention rules to automatically delete older tags. These rules process daily in the background.
                        A global rule applies to all repositories unless overridden by a repository-specific rule.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Repository Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Scope</label>
                            <div className="relative">
                                <select
                                    value={selectedRepo}
                                    onChange={(e) => setSelectedRepo(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="global">Global (All Repositories)</option>
                                    <optgroup label="Specific Repository">
                                        {repositories.map(repo => (
                                            <option key={repo} value={repo}>{repo}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Keep N Tags Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Keep Last N Tags</label>
                            <input
                                type="number"
                                min="1"
                                value={keepN}
                                onChange={(e) => setKeepN(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. 5"
                            />
                        </div>
                    </div>

                    {/* Actions and Status */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSavePolicy}
                                disabled={savingPolicy || !keepN || keepN < 1}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50"
                            >
                                {savingPolicy ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                {savingPolicy ? 'Saving...' : 'Save Policy'}
                            </button>
                            <button
                                onClick={() => setShowPolicyModal(true)}
                                disabled={runningPolicy}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                                title="Run all policies immediately"
                            >
                                {runningPolicy ? <RefreshCw size={16} className="animate-spin text-gray-500" /> : <Play size={16} className="text-gray-500" />}
                                {runningPolicy ? 'Running...' : 'Run Policies Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Confirm Modals */}
            <ConfirmModal
                isOpen={showGCModal}
                onClose={() => setShowGCModal(false)}
                onConfirm={() => {
                    setShowGCModal(false);
                    executeGC();
                }}
                title="Run Garbage Collection"
                message="Are you sure you want to run Garbage Collection? This will free up space from deleted images. It might take a few seconds."
                confirmText="Run GC"
                icon={Trash2}
                isDestructive={true}
            />

            <ConfirmModal
                isOpen={showPolicyModal}
                onClose={() => setShowPolicyModal(false)}
                onConfirm={() => {
                    setShowPolicyModal(false);
                    executeRunPolicies();
                }}
                title="Execute Retention Policies"
                message="Run all retention policies now? This will immediately delete tags that exceed the configured limits across all repositories."
                confirmText="Run Policies"
                icon={Play}
                isDestructive={true}
            />
        </motion.div>
    );
};

export default StorageTab;
