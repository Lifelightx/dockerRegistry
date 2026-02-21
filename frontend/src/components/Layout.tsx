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
        <div className="h-screen flex overflow-hidden bg-[#f8fafc] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* ─── Desktop Sidebar ─── */}
            <aside
                className={cn(
                    'hidden md:flex flex-col border-r border-gray-200/60 dark:border-gray-800 bg-[#fbfcfd] dark:bg-gray-900 fixed h-full z-20 transition-all duration-300',
                    sidebarW
                )}
            >
                {/* Logo + collapse toggle */}
                <div className="h-[72px] flex items-center justify-between px-4 border-b border-gray-200/60 dark:border-gray-800 shrink-0">
                    <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center w-full')}>
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                            <Package size={18} />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 whitespace-nowrap leading-none">
                                    Registry
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wider lowercase mt-0.5">
                                    by jeeban
                                </span>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
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
                        className="mx-auto mt-3 p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={collapsed ? item.name : undefined}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden focus:outline-none border border-transparent',
                                    collapsed && 'justify-center',
                                    isActive
                                        ? 'bg-white dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-gray-200/60 dark:border-transparent'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full shadow-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                                <Icon size={isActive ? 20 : 18} className={cn(isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400', 'transition-colors')} />
                                {!collapsed && item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card + logout */}
                <div className="p-4 border-t border-gray-200/60 dark:border-gray-800 shrink-0">
                    {!collapsed ? (
                        <>
                            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 mb-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-200/60 dark:border-gray-700/50">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner">
                                    {user?.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.username}</p>
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium mt-0.5">
                                        <ShieldCheck size={10} className="text-blue-500" />{user?.role}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400/90 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </>
                    ) : (
                        /* Collapsed: just avatar + logout icon stacked */
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md" title={user?.username}>
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className={cn('flex-1 h-screen overflow-y-auto flex flex-col min-w-0 transition-all duration-300 bg-[#f8fafc] dark:bg-gray-950', mainOffset)}>

                {/* Sticky Navbar */}
                <header className="h-[72px] bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 px-6 lg:px-8 flex items-center justify-between shrink-0 transition-all duration-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-none">
                    {/* Mobile hamburger */}
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <Menu size={20} />
                        </button>
                        <div className="flex flex-col mt-1">
                            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 leading-none">Registry</span>
                            <span className="text-[10px] text-gray-500 font-medium tracking-wide lowercase mt-0.5">by jeeban</span>
                        </div>
                    </div>

                    {/* Page title — desktop */}
                    <div className="flex-1 hidden md:flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full shadow-sm"></div>
                        <h1 className="text-[1.15rem] font-bold tracking-tight text-gray-900 dark:text-white">
                            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-5">
                        {/* Premium Theme Toggle */}
                        <div className="flex items-center bg-gray-100/80 dark:bg-gray-900/80 p-1 rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-inner">
                            <button
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-full transition-all duration-300 flex items-center justify-center group",
                                    theme === 'light'
                                        ? "bg-white text-indigo-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                                        : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                )}
                                title="Light Mode"
                            >
                                <Sun size={15} className={cn("transition-transform duration-300", theme === 'light' ? "scale-110" : "group-hover:rotate-45")} />
                            </button>
                            <button
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={cn(
                                    "p-1.5 md:p-2 rounded-full transition-all duration-300 flex items-center justify-center group",
                                    theme === 'dark'
                                        ? "bg-gray-800 text-indigo-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-gray-700/50"
                                        : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                )}
                                title="Dark Mode"
                            >
                                <Moon size={15} className={cn("transition-transform duration-300", theme === 'dark' ? "scale-110" : "group-hover:-rotate-12")} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content — scrollable */}
                <div className="flex-1 p-6 lg:p-8">
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
                            <div className="p-6 flex justify-between items-start border-b border-gray-100 dark:border-gray-800">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xl leading-none">Registry</span>
                                    <span className="text-[11px] text-gray-500 font-medium tracking-wide lowercase mt-1">by jeeban</span>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="-mt-1"><X size={24} /></button>
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
