import { Box } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsTab = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full text-center p-12"
    >
        <Box size={64} className="text-gray-200 dark:text-gray-700 mb-6" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
        <p className="text-gray-500 dark:text-gray-400">This feature module is currently being built.</p>
    </motion.div>
);

export default AnalyticsTab;
