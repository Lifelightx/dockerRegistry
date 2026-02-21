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
    Settings,
    ChevronLeft,
    ChevronRight,
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
    const [isSidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
    const [collapsed, setCollapsed] = useState(false);          // desktop collapse
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        ...(user?.role === 'admin' ? [{ name: 'User Management', path: '/admin/users', icon: Users }] : []),
        { name: 'Recent Activities', path: '/recent-activities', icon: Activity },
        ...(user?.role === 'admin' ? [{ name: 'System Settings', path: '/admin/settings', icon: Settings }] : []),
    ];

    const sidebarW = collapsed ? 'w-16' : 'w-64';
    const mainOffset = collapsed ? 'md:ml-16' : 'md:ml-64';

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* ─── Desktop Sidebar ─── */}
            <aside
                className={cn(
                    'hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed h-full z-20 transition-all duration-300',
                    sidebarW
                )}
            >
                {/* Logo + collapse toggle */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                            <Package size={18} />
                        </div>
                        {!collapsed && (
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 whitespace-nowrap">
                                Registry
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                            title="Collapse sidebar"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed — sits at top of nav area */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="mx-auto mt-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}

                {/* Nav Items */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={collapsed ? item.name : undefined}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                                    collapsed && 'justify-center',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
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
                                <Icon size={20} className={cn(isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300')} />
                                {!collapsed && item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card + logout */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    {!collapsed ? (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {user?.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user?.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <ShieldCheck size={10} />{user?.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </>
                    ) : (
                        /* Collapsed: just avatar + logout icon stacked */
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold" title={user?.username}>
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={logout} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className={cn('flex-1 h-screen overflow-y-auto flex flex-col min-w-0 transition-all duration-300', mainOffset)}>

                {/* Sticky Navbar */}
                <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between shrink-0">
                    {/* Mobile hamburger */}
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-400">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg">Registry</span>
                    </div>

                    {/* Page title — desktop */}
                    <div className="flex-1 hidden md:block">
                        <h1 className="text-lg font-semibold capitalize text-gray-800 dark:text-white">
                            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>

                {/* Page content — scrollable */}
                <div className="flex-1 p-6">
                    <Outlet />
                </div>
            </main>

            {/* ─── Mobile Sidebar Drawer ─── */}
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
                            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-40 md:hidden shadow-xl flex flex-col"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-xl">Registry</span>
                                <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
                            </div>
                            <nav className="p-4 space-y-1 flex-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg font-medium',
                                            location.pathname === item.path ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-600 dark:text-gray-400'
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
