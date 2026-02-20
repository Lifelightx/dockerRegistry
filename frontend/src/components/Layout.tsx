import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    Package,
    ShieldCheck,
    Activity,
    Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const Layout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        ...(user?.role === 'admin' ? [{ name: 'User Management', path: '/admin/users', icon: Users }] : []),
        { name: 'Recent Activities', path: '/recent-activities', icon: Activity },
        ...(user?.role === 'admin' ? [{ name: 'System Settings', path: '/admin/settings', icon: Settings }] : []),
    ];

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-x-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed h-full z-20">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Package size={24} />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Registry
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                                <Icon size={20} className={cn(isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                <ShieldCheck size={10} />
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col overflow-x-hidden min-w-0">
                {/* Navbar - Mobile & Tools */}
                <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-400">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg">Registry</span>
                    </div>

                    <div className="flex-1 hidden md:block">
                        <h1 className="text-lg font-semibold capitalize text-gray-800 dark:text-white">
                            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>

                <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black z-30 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-40 md:hidden shadow-xl"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-xl">Registry</span>
                                <button onClick={() => setSidebarOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="p-4 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg font-medium",
                                            location.pathname === item.path ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-gray-600 dark:text-gray-400"
                                        )}
                                    >
                                        <item.icon size={20} />
                                        {item.name}
                                    </Link>
                                ))}
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 px-4 py-3 w-full text-red-600 mt-4 border-t border-gray-100 dark:border-gray-800"
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Layout;
