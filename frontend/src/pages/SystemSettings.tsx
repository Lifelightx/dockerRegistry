import { useState } from 'react';
import { Shield, Bell, Users, BarChart3, HardDrive, Box } from 'lucide-react';
import StorageTab from '../components/settings/StorageTab';
import SecurityTab from '../components/settings/SecurityTab';
import NotificationsTab from '../components/settings/NotificationsTab';
import IamTab from '../components/settings/IamTab';
import AnalyticsTab from '../components/settings/AnalyticsTab';
import HelmChartsTab from '../components/settings/HelmChartsTab';

const tabs = [
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security & Scanning', icon: Shield },
    { id: 'integration', label: 'Notifications', icon: Bell },
    // { id: 'access', label: 'IAM', icon: Users },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'helm', label: 'Helm Charts', icon: Box },
];

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('storage');

    const renderTab = () => {
        switch (activeTab) {
            case 'storage': return <StorageTab />;
            case 'security': return <SecurityTab />;
            case 'integration': return <NotificationsTab />;
            case 'access': return <IamTab />;
            case 'analytics': return <AnalyticsTab />;
            case 'helm': return <HelmChartsTab />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                {/* Tab Bar */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-1 min-w-max">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === id
                                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-500'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-auto custom-scrollbar">
                    {renderTab()}
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
