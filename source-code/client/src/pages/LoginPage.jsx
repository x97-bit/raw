import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #070f1a 0%, #0c1d2e 25%, #102a43 55%, #1a3a5c 80%, #1e3f60 100%)' }}>

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
      </div>

      <div
        className="w-full max-w-[400px] relative z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Logo & Brand */}
        <div className="text-center mb-9">
          <div className="relative inline-block mb-5">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(9,103,210,0.25) 0%, rgba(255,255,255,0.08) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 0 0 1px rgba(9,103,210,0.15), 0 8px 32px rgba(0,0,0,0.3), 0 0 60px rgba(9,103,210,0.1)',
              }}>
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(9,103,210,0.25), transparent 70%)' }} />
              <span className="relative text-[34px] font-bold text-white" style={{ textShadow: '0 2px 12px rgba(9,103,210,0.5)' }}>
                ر
              </span>
            </div>
            {/* Glow ring */}
            <div className="absolute -inset-1 rounded-3xl opacity-30 blur-md"
              style={{ background: 'radial-gradient(circle, rgba(9,103,210,0.4), transparent 70%)' }} />
          </div>
          <h1 className="text-[30px] font-bold text-white tracking-tight"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            نظام الراوي
          </h1>
          <p className="text-sm text-white/40 mt-1.5 font-light tracking-wide">
            إدارة التجارة الحدودية
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 40px rgba(0,0,0,0.18), 0 24px 64px rgba(0,0,0,0.1)',
          }}>

          <div className="flex items-center justify-between mb-6">
            <div className="h-px flex-1 bg-gray-100" />
            <h2 className="text-base font-bold text-gray-700 px-4">تسجيل الدخول</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5"
              style={{
                background: 'linear-gradient(135deg, #fff5f5, #fff0f0)',
                border: '1px solid rgba(225,45,57,0.15)',
                color: '#be123c',
              }}>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-500 mb-1.5 tracking-wide">
                اسم المستخدم
              </label>
              <div className="relative">
                <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="input-field pr-10"
                  placeholder="أدخل اسم المستخدم"
                  autoFocus required
                  style={{ paddingRight: '2.5rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-500 mb-1.5 tracking-wide">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10 pl-10"
                  placeholder="أدخل كلمة المرور"
                  required
                  style={{ paddingRight: '2.5rem', paddingLeft: '2.5rem' }}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit" disabled={loading}
                className="w-full btn-primary py-3 text-[14.5px] rounded-xl disabled:opacity-60 flex items-center justify-center gap-2.5 mt-1"
                style={{ letterSpacing: '0.01em' }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft size={17} />
                    <span>دخول</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-white/20 text-[11px] mt-7 font-light tracking-wider">
          نظام الراوي © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>

      <style>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          top: -15%; right: -10%;
          background: radial-gradient(circle, rgba(9,103,210,0.12) 0%, transparent 65%);
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          bottom: -10%; left: -8%;
          background: radial-gradient(circle, rgba(16,42,67,0.2) 0%, transparent 65%);
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 300px; height: 300px;
          top: 50%; left: 40%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(5,82,181,0.07) 0%, transparent 65%);
          animation: orbFloat 12s ease-in-out infinite 2s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.05); }
          66% { transform: translate(-15px, 10px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
