import { useState, useEffect } from 'react';
import { Mail, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useNotification } from '../../context/NotificationContext';

export interface NotificationSettings {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    emailFrom: string;
    emailTo: string;
}

const NotificationsTab = () => {
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        emailFrom: '',
        emailTo: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const { success, error: showError } = useNotification();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings/notifications');
                if (data && Object.keys(data).length > 0) {
                    setSettings((prev) => ({ ...prev, ...data }));
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/settings/notifications', settings);
            success('Notification settings saved successfully');
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!settings.smtpHost || !settings.emailTo) {
            showError('Please configure SMTP Host and Recipient Email first');
            return;
        }

        setTesting(true);
        try {
            await api.post('/settings/notifications/test', settings);
            success('Test email sent successfully! Please check your inbox.');
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to send test email. Check your SMTP configuration.');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Mail className="text-blue-500" size={24} />
                    Email Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure SMTP settings to receive email alerts when images or tags are pushed to the registry.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden shadow-sm">

                {/* Enable Toggle */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Enable Notifications</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Turn push event notifications on or off.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="enabled" checked={settings.enabled} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SMTP Host */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">SMTP Host</label>
                            <input
                                type="text"
                                name="smtpHost"
                                value={settings.smtpHost}
                                onChange={handleChange}
                                placeholder="smtp.gmail.com"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* SMTP Port */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">SMTP Port</label>
                            <input
                                type="number"
                                name="smtpPort"
                                value={settings.smtpPort}
                                onChange={handleChange}
                                placeholder="587"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* SMTP Username */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">SMTP Username</label>
                            <input
                                type="text"
                                name="smtpUser"
                                value={settings.smtpUser}
                                onChange={handleChange}
                                placeholder="user@example.com"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* SMTP Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">SMTP Password / App Password</label>
                            <input
                                type="password"
                                name="smtpPass"
                                value={settings.smtpPass}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700/60 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* From Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">From Email</label>
                            <input
                                type="email"
                                name="emailFrom"
                                value={settings.emailFrom}
                                onChange={handleChange}
                                placeholder="no-reply@myregistry.com"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* To Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recipient Email(s)</label>
                            <input
                                type="text"
                                name="emailTo"
                                value={settings.emailTo}
                                onChange={handleChange}
                                placeholder="admin@example.com, dev@example.com"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-2">Comma separated for multiple recipients.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <button
                        onClick={handleTest}
                        disabled={testing || saving || !settings.smtpHost}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                        Send Test Email
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving || testing}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        Save Configuration
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default NotificationsTab;
