import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AppUser } from './types';

interface LoginProps {
  onLogin: (username: string, password?: string, isBypass?: boolean) => void | Promise<void>;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    
    try {
      await onLogin(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = () => {
    onLogin('developer', undefined, true);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_#312e81_50%,_#1e1b4b_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 overflow-hidden">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-[#1e1b4b] tracking-tight mb-1 uppercase">Vangarde Group</h1>
            <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">Internal Performance Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <ShieldCheck size={12} strokeWidth={3} />
                </div>
                <p className="text-[10px] font-bold text-rose-600 leading-tight">{error}</p>
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                placeholder="Username"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5850ec] hover:bg-[#4f46e5] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Developer Bypass - Temporary (Hidden for production)
          <div className="mt-8 pt-6 border-t border-slate-50">
            <button
              onClick={handleBypass}
              className="w-full py-2 text-slate-300 hover:text-indigo-400 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Developer Bypass
            </button>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default Login;
