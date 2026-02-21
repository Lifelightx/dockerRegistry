import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Loader2, Package, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.post('/api/users/login', { username, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* Left Side: Form */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10 w-full lg:w-1/2">
                {/* Mobile Background Elements */}
                <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden lg:hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
                </div>

                <div className="mx-auto w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="mb-10 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Package size={22} />
                                </div>
                                <div className="flex flex-col mt-1">
                                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 leading-none">
                                        Registry
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide lowercase mt-1 text-left">
                                        by jeeban
                                    </span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                                Welcome back
                            </h2>
                            <p className="text-[0.95rem] text-gray-500 dark:text-gray-400">
                                Please enter your details to sign in.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3 shadow-sm backdrop-blur-sm"
                            >
                                <span className="mt-0.5 text-red-500">⚠️</span>
                                <span className="leading-snug">{error}</span>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-11 py-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative mt-4 py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group"
                            >
                                {/* Subtle gradient overlay on hover */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>

                                {loading ? (
                                    <Loader2 className="animate-spin relative z-10" size={20} />
                                ) : (
                                    <span className="relative z-10">Sign in</span>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    <div className="mt-12 text-center lg:text-left text-xs text-gray-400 dark:text-gray-500 font-medium">
                        &copy; 2026 Registry Wrapper. Secure & Modern.
                    </div>
                </div>
            </div>

            {/* Right Side: Presentation / Illustration (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden items-center justify-center border-l border-gray-800">
                {/* Dynamic Background */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                        alt="Abstract Art"
                        className="w-full h-full object-cover opacity-30 select-none mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-gray-900/90 to-black/90 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-700" />

                {/* Embedded Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 w-full max-w-[400px] p-8 mx-auto xl:mr-32 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
                >
                    {/* Glass glare effect */}
                    <div className="absolute top-0 right-0 w-full h-[50%] bg-gradient-to-b from-white/10 to-transparent transform -skew-y-12 translate-y-[-50%] pointer-events-none" />

                    <div className="flex flex-col gap-6">
                        <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                            <ShieldCheck size={24} />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Secure Enterprise Registry</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Experience lighting-fast container deployments with built-in security scanning, role-based access control, and seamless ecosystem integrations.
                            </p>
                        </div>

                        <div className="pt-6 mt-2 border-t border-white/10 flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-gray-900"></div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold">+9</div>
                                <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-gray-300">
                                    <Zap size={16} className="text-yellow-500" />
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                Trusted by engineering teams.
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
