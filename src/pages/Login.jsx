import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, rememberMe);
      if (!user || !user.role) { setError('Login failed: invalid response'); return; }
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="gradient-secondary fixed inset-0" />
      <div className="fixed inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <button onClick={() => navigate('/')} className="absolute top-4 left-3 sm:top-8 sm:left-8 z-10 p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 hover:opacity-80 transition-opacity"><ArrowLeft className="w-4 h-4 text-white" /></button>
      <button onClick={() => navigate('/')} className="absolute top-4 left-16 sm:top-8 sm:left-20 flex items-center gap-3 z-10 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-white font-semibold text-sm">MA'AD AHLIL AATHAR</p>
          <p className="text-white/40 text-xs">Assessment System</p>
        </div>
      </button>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <Card className="p-8 border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-accent mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-white/50 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@maad.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
              />
              <label htmlFor="rememberMe" className="text-sm text-white/60 cursor-pointer select-none">
                Remember me for 7 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gradient-accent text-white border-0"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-white/30 text-xs">Assessment System v2.0</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
