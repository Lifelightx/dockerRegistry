import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Tag, Trash2, Copy, Check, Clock, Shield, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RepoDetails {
    name: string;
    tags: string[];
    registryHost: string;
}

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
}

const RepositoryDetails = () => {
    const { name } = useParams<{ name: string }>();
    const [details, setDetails] = useState<RepoDetails | null>(null);
    const [tagDetails, setTagDetails] = useState<Record<string, TagDetail>>({});
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (name) fetchDetails();
    }, [name]);

    const fetchDetails = async () => {
        try {
            if (!name) return;
            const { data } = await api.get<RepoDetails>(`/registry/repositories/${encodeURIComponent(name)}`);
            setDetails(data);
            console.log(data)
            if (data.tags) {
                data.tags.forEach(t => fetchTagInfo(name, t));
            }
        } catch (error) {
            console.error('Failed to fetch details', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTagInfo = async (repoName: string, tag: string) => {
        try {
            const { data } = await api.get<TagDetail>(`/registry/repositories/${encodeURIComponent(repoName)}/tags/${tag}`);
            setTagDetails(prev => ({ ...prev, [tag]: data }));
        } catch (e) {
            console.error(`Failed tag info ${tag}`, e);
        }
    }

    const handleDelete = async (tag: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}:${tag}?`)) return;
        try {
            if (!name) return;
            await api.delete(`/registry/repositories/${encodeURIComponent(name)}/tags/${tag}`);
            setDetails(prev => prev ? ({ ...prev, tags: prev.tags.filter(t => t !== tag) }) : null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete tag');
        }
    };

    const copyCommand = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // fallback
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }

            setCopied(text);
            setTimeout(() => setCopied(null), 2000);

        } catch (err) {
            console.error("Copy failed:", err);
        }
    };


    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!details) return <div>Repository not found</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-gray-400 font-normal">repository /</span> {details.name}
                    </h1>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Image Tags
                    </h3>
                    <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
                        {details.tags?.length || 0} Total
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                <th className="px-6 py-3 w-48">Tag</th>
                                <th className="px-6 py-3">Digest</th>
                                <th className="px-6 py-3">Size</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3">Interact</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {details.tags && details.tags.length > 0 ? (
                                details.tags.map((tag) => {
                                    const tagInfo = tagDetails[tag];
                                    const pullCmd = `docker pull ${details.registryHost}/${details.name}:${tag}`;

                                    return (
                                        <tr key={tag} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-blue-500" />
                                                    <Link to={`/repository/${encodeURIComponent(details.name)}/tags/${tag}`} className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                        {tag}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tagInfo ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 copy-trigger" title={tagInfo.digest}>
                                                        <Shield size={12} className="text-green-500" />
                                                        {tagInfo.digest.substring(0, 12)}...
                                                    </div>
                                                ) : <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded"></span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tagInfo ? (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {formatSize(tagInfo.size)}
                                                    </span>
                                                ) : <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-12 rounded"></span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tagInfo?.created ? (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {new Date(tagInfo.created).toLocaleDateString()}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tagInfo?.architecture || tagInfo?.os ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 w-fit">
                                                        {tagInfo.os}/{tagInfo.architecture}
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => copyCommand(pullCmd)}
                                                    title={pullCmd}
                                                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none ${copied === pullCmd
                                                            ? 'bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400'
                                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                                                        }`}
                                                >
                                                    {copied === pullCmd ? (
                                                        <>
                                                            <Check size={12} className="shrink-0" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Terminal size={12} className="shrink-0" />
                                                            Pull
                                                            <Copy size={11} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        </>
                                                    )}
                                                </button>

                                                {(user?.role === 'admin' || user?.role === 'maintainer') && (
                                                    <button
                                                        onClick={() => handleDelete(tag)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Delete Version"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No tags found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RepositoryDetails;
