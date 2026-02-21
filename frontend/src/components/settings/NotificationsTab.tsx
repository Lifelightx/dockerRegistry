import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhooks &amp; Notifications</h3>
        <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h4 className="text-gray-900 dark:text-white font-medium mb-2">Event Notifiers</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                Connect Slack, Discord, or generic webhooks to receive alerts for Push/Pull events.
            </p>
        </div>
    </motion.div>
);

export default NotificationsTab;
