
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, FileJson, Layers, Clock, Shield, HardDrive, Calendar, Hash, Trash2, Monitor, AlertTriangle, CheckCircle } from 'lucide-react';

interface TagDetail {
    name: string;
    tag: string;
    digest: string;
    size: number;
    created?: string;
    history?: { created: string; created_by: string; empty_layer?: boolean }[];
    architecture?: string;
    os?: string;
    manifest?: any;
    stats?: { push: number; pull: number };
    pushedBy?: string;
}

interface ScanResult {
    scan_status: 'unscanned' | 'pending' | 'completed' | 'failed';
    severity_summary?: {
        Critical: number;
        High: number;
        Medium: number;
        Low: number;
    };
    last_scanned?: string;
}

const HighlightJSON = ({ json }: { json: any }) => {
    if (!json) return null;

    const str = JSON.stringify(json, null, 2);

    // Regex to match JSON parts
    const parts = str.split(/(".*?"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[:,[\]{}])/g).filter(Boolean);

    return (
        <pre className="whitespace-pre-wrap font-mono text-sm">
            {parts.map((part, i) => {
                let className = 'text-gray-600 dark:text-gray-400';

                if (part === '{' || part === '}' || part === '[' || part === ']' || part === ':' || part === ',') {
                    className = 'text-gray-500 dark:text-gray-500';
                } else if (part.startsWith('"')) {
                    if (parts[i + 1]?.trim() === ':') {
                        className = 'json-key';
                    } else {
                        className = 'json-string';
                    }
                } else if (/true|false/.test(part)) {
                    className = 'json-boolean';
                } else if (/null/.test(part)) {
                    className = 'json-null';
                } else if (/^-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?$/.test(part)) {
                    className = 'json-number';
                }

                return (
                    <span key={i} className={className}>
                        {part}
                    </span>
                );
            })}
        </pre>
    );
};

const TagDetails = () => {
    const { name, tag } = useParams<{ name: string; tag: string }>();
    const navigate = useNavigate();
    const [tagData, setTagData] = useState<TagDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scanData, setScanData] = useState<ScanResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<'manifest' | 'history' | 'stats'>('manifest');

    useEffect(() => {
        if (name && tag) {
            fetchTagDetails();
            fetchScanStatus();
        }
    }, [name, tag]);

    // Poll for scan status if pending
    useEffect(() => {
        if (scanData?.scan_status === 'pending') {
            const interval = setInterval(fetchScanStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [scanData?.scan_status]);

    const fetchScanStatus = async () => {
        try {
            const { data } = await api.get(`/ registry / repositories / ${ encodeURIComponent(name || '') } /tags/${ tag }/scan`);
setScanData(data);
        } catch (e) {
    console.error('Failed to fetch scan status', e);
    setScanData({ scan_status: 'unscanned' }); // Default to unscanned if API fails
}
    };

const fetchTagDetails = async () => {
    setLoading(true);
    setError('');
    try {
        const { data } = await api.get(`/registry/repositories/${encodeURIComponent(name || '')}/tags/${tag}`);
        setTagData(data);
    } catch (error) {
        console.error('Failed to fetch tag details', error);
        setError('Failed to load tag details.');
    } finally {
        setLoading(false);
    }
};

if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-white dark:bg-black">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}

if (error) {
    return (
        <div className="flex justify-center items-center h-screen bg-white dark:bg-black text-red-500">
            {error}
        </div>
    );
}

if (!tagData) {
    return (
        <div className="flex justify-center items-center h-screen bg-white dark:bg-black">
            <div className="text-gray-500 dark:text-gray-400">No tag data available.</div>
        </div>
    );
}

return (

    <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
            <Link to={`/repository/${encodeURIComponent(name || '')}`} className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-4 transition-colors group">
                <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Repository
            </Link>
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        {tag}
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-sm font-medium border border-blue-100 dark:border-blue-900">
                            Tag
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">{name}:{tag}</p>
                </div>
            </div>
        </div>

        <div>
            {/* Main Content */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-[600px] flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => setActiveTab('manifest')}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'manifest'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <FileJson size={16} className="mr-2" />
                            Manifest
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Clock size={16} className="mr-2" />
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'stats'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Layers size={16} className="mr-2" />
                            Stats
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'manifest' ? (
                            <div className="h-full overflow-hidden">
                                <div className="h-full overflow-auto custom-scrollbar p-6 text-sm font-mono leading-relaxed bg-gray-50 dark:bg-gray-950">
                                    <HighlightJSON json={tagData.manifest} />
                                </div>
                            </div>
                        ) : activeTab === 'history' ? (
                            <div className="h-full overflow-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
                                {tagData.history?.map((layer, i) => (
                                    <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <div className="min-w-[24px] h-6 flex items-center justify-center text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-400 transition-colors">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all whitespace-pre-wrap">
                                                    {layer.created_by || 'No command'}
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                    <span className="flex items-center">
                                                        <Clock size={12} className="mr-1" />
                                                        {layer.created ? new Date(layer.created).toLocaleString() : 'Unknown'}
                                                    </span>
                                                    {layer.empty_layer && (
                                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-gray-700">
                                                            EMPTY LAYER
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!tagData.history || tagData.history.length === 0) && (
                                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        No history available
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Pulls (Repo)</h3>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{tagData.stats?.pull || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Pushes (Repo)</h3>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{tagData.stats?.push || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="flex items-center text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                        <Shield size={16} className="mr-2" />
                                        About these stats
                                    </h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                                        Statistics are aggregated for the repository <strong>{name}</strong>.
                                        Due to the nature of container registries, detailed push/pull statistics for individual tags are approximate.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar / Metadata */}
            <div className="mt-5">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Metadata</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Digest
                            </label>
                            <div className="flex items-center gap-2 font-mono text-sm text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                {tagData.digest}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                OS / Arch
                            </label>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                {tagData.os}/{tagData.architecture}
                            </span>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Size
                            </label>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {(tagData.size / 1000000).toFixed(2)} MB
                            </span>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Created
                            </label>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Clock size={16} className="mr-2 text-gray-400" />
                                {tagData.created ? new Date(tagData.created).toLocaleString() : 'Unknown'}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Pushed By
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                                    {tagData.pushedBy ? tagData.pushedBy.substring(0, 2) : 'Un'}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {tagData.pushedBy || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

);
};

export default TagDetails;
