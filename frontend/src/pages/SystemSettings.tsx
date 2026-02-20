import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { RefreshCw, Trash2, Shield, Bell, Users, BarChart3, HardDrive, Box, ChevronDown, Search, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScanResult {
    scan_status: 'unscanned' | 'pending' | 'completed' | 'failed';
    severity_summary?: { Critical: number; High: number; Medium: number; Low: number; };
    vulnerabilities?: { VulnerabilityID: string; PkgName: string; InstalledVersion: string; Severity: string; Title: string; }[];
    last_scanned?: string;
}

const SEVERITY_COLOR: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const SecurityScanner = () => {
    const [repos, setRepos] = useState<string[]>([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState('');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loadingRepos, setLoadingRepos] = useState(true);
    const [loadingTags, setLoadingTags] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        api.get('/registry/repositories')
            .then(({ data }) => setRepos((data.repositories || data || []).map((r: any) => r.name || r)))
            .catch(() => { })
            .finally(() => setLoadingRepos(false));
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    const onRepoChange = async (repo: string) => {
        setSelectedRepo(repo);
        setSelectedTag('');
        setTags([]);
        setScanResult(null);
        if (!repo) return;
        setLoadingTags(true);
        try {
            const { data } = await api.get(`/registry/repositories/${encodeURIComponent(repo)}`);
            setTags((data.tags || []).map((t: any) => t.name || t));
        } catch { setTags([]); }
        finally { setLoadingTags(false); }
    };

    const onTagChange = async (tag: string) => {
        setSelectedTag(tag);
        setScanResult(null);
        if (!tag || !selectedRepo) return;
        setLoadingStatus(true);
        try {
            const { data } = await api.get(`/registry/repositories/${encodeURIComponent(selectedRepo)}/tags/${tag}/scan`);
            setScanResult(data);
        } catch { setScanResult({ scan_status: 'unscanned' }); }
        finally { setLoadingStatus(false); }
    };

    const startPoll = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const { data } = await api.get(`/registry/repositories/${encodeURIComponent(selectedRepo)}/tags/${selectedTag}/scan`);
                setScanResult(data);
                if (data.scan_status !== 'pending') {
                    clearInterval(pollRef.current!);
                    setScanning(false);
                }
            } catch { }
        }, 3000);
    };

    const handleScan = async () => {
        if (!selectedRepo || !selectedTag) return;
        setScanning(true);
        setScanResult({ scan_status: 'pending' });
        try {
            await api.post(`/registry/repositories/${encodeURIComponent(selectedRepo)}/tags/${selectedTag}/scan`, {});
            startPoll();
        } catch {
            setScanResult({ scan_status: 'failed' });
            setScanning(false);
        }
    };

    const statusBadge = () => {
        if (!scanResult) return null;
        const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20', icon: <Clock size={14} />, label: 'Scanning...' },
            completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/20', icon: <CheckCircle size={14} />, label: 'Completed' },
            failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/20', icon: <XCircle size={14} />, label: 'Failed' },
            unscanned: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800', icon: <Shield size={14} />, label: 'Not Scanned' },
        };
        const s = map[scanResult.scan_status] || map.unscanned;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                {s.icon}{s.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Shield size={20} className="text-indigo-500" />
                    Vulnerability Scanner
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select an image and tag to scan for CVEs using Trivy.</p>
            </div>

            {/* Selector */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Repository */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Repository</label>
                        <div className="relative">
                            <select
                                value={selectedRepo}
                                onChange={e => onRepoChange(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">{loadingRepos ? 'Loading...' : 'Select repository'}</option>
                                {repos.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Tag */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tag</label>
                        <div className="relative">
                            <select
                                value={selectedTag}
                                onChange={e => onTagChange(e.target.value)}
                                disabled={!selectedRepo || loadingTags}
                                className="w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <option value="">{loadingTags ? 'Loading tags...' : 'Select tag'}</option>
                                {tags.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleScan}
                        disabled={!selectedRepo || !selectedTag || scanning || loadingStatus}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        <Search size={16} className={(scanning || loadingStatus) ? 'animate-pulse' : ''} />
                        {loadingStatus ? 'Loading...' : scanning ? 'Scanning...' : 'Scan Image'}
                    </button>
                    {statusBadge()}
                    {scanResult?.last_scanned && (
                        <span className="text-xs text-gray-400">
                            Last scanned: {new Date(scanResult.last_scanned).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Results */}
            {scanResult?.scan_status === 'pending' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    Trivy is scanning the image... This may take up to a minute.
                </motion.div>
            )}

            {scanResult?.scan_status === 'failed' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle size={20} className="inline mr-2" />
                    Scan failed. Ensure the backend has Docker socket access and Trivy is available. Check backend logs for details.
                </motion.div>
            )}

            {scanResult?.scan_status === 'completed' && scanResult.severity_summary && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => (
                            <div key={sev} className={`p-4 rounded-xl border text-center min-w-0 ${SEVERITY_COLOR[sev.toUpperCase()]}`}>
                                <div className="text-2xl font-bold mb-1">{scanResult.severity_summary![sev]}</div>
                                <div className="text-xs font-semibold uppercase tracking-wider">{sev}</div>
                            </div>
                        ))}
                    </div>

                    {/* CVE Table */}
                    {scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0 && (
                        <div className="rounded-xl custom-scrollbar border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                                <h4 className="text-sm  font-semibold text-gray-900 dark:text-white">
                                    Vulnerabilities ({scanResult.vulnerabilities.length})
                                </h4>
                            </div>
                            <div className="overflow-x-auto max-h-80 custom-scrollbar overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">CVE ID</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Package</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Version</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Severity</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Title</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {scanResult.vulnerabilities.map((v, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-2 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{v.VulnerabilityID}</td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">{v.PkgName}</td>
                                                <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{v.InstalledVersion}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLOR[v.Severity] || 'bg-gray-100 text-gray-600'}`}>
                                                        {v.Severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs max-w-xs truncate">{v.Title}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {scanResult.vulnerabilities?.length === 0 && (
                        <div className="p-8 text-center bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                            <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                            <p className="font-semibold text-green-700 dark:text-green-400">No vulnerabilities found!</p>
                            <p className="text-sm text-gray-500 mt-1">This image is clean according to Trivy's database.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('storage');
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

    const tabs = [
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'security', label: 'Security & Scanning', icon: Shield },
        { id: 'integration', label: 'Notifications', icon: Bell },
        { id: 'access', label: 'IAM', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'helm', label: 'Helm Charts', icon: Box },
    ];

    return (
        <div className="space-y-6 w-full">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                {/* Horizontal Tab Bar */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-1 min-w-max">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-500'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-auto custom-scrollbar">
                    {activeTab === 'storage' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                            {/* Garbage Collection Section */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Trash2 size={20} className="text-red-500" />
                                    Garbage Collection
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                                        Soft-deleted manifests are not automatically removed from the file system.
                                        Run Garbage Collection to free up disk space by removing unreferenced blobs.
                                        <b className="block mt-2 text-green-600 dark:text-green-400">Note: This action is safe! It only removes data that is no longer referenced by any tag.</b>
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={handleGC}
                                            disabled={gcing}
                                            className="w-fit flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw size={18} className={gcing ? "animate-spin" : ""} />
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

                            {/* Retention Policies Placeholder */}
                            <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <HardDrive size={20} className="text-blue-500" />
                                    Retention Policies
                                </h3>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">Automated retention rules (e.g., maintain last 5 tags) are coming soon.</p>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <SecurityScanner />
                        </motion.div>
                    )}

                    {activeTab === 'integration' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhooks & Notifications</h3>
                            <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h4 className="text-gray-900 dark:text-white font-medium mb-2">Event Notifiers</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                                    Connect Slack, Discord, or generic webhooks to receive alerts for Push/Pull events.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Placeholders for other tabs */}
                    {['access', 'analytics', 'helm'].includes(activeTab) && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center p-12">
                            <Box size={64} className="text-gray-200 dark:text-gray-700 mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                This feature module is currently being built.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;

