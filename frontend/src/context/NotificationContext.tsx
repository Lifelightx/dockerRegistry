import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const iconMap = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertTriangle className="text-yellow-500" size={20} />
};

const bgMap = {
    success: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
    error: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    warning: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20'
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback((message: string, type: NotificationType = 'info', title?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, title }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, [removeNotification]);

    const success = useCallback((message: string, title?: string) => showNotification(message, 'success', title), [showNotification]);
    const error = useCallback((message: string, title?: string) => showNotification(message, 'error', title), [showNotification]);
    const info = useCallback((message: string, title?: string) => showNotification(message, 'info', title), [showNotification]);
    const warning = useCallback((message: string, title?: string) => showNotification(message, 'warning', title), [showNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification, success, error, info, warning }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            layout
                            className={`pointer-events-auto flex gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${bgMap[notification.type]} bg-white/90 dark:bg-gray-900/90`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {iconMap[notification.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                                {notification.title && (
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                        {notification.title}
                                    </h4>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors self-start -mt-1 -mr-1"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
