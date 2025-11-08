import React, { useState } from 'react';
import { Mail, Lock, Facebook, Github, Linkedin, ArrowRight } from 'lucide-react';

const LoginPage = ({ onLogin, onSwitchRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = { email: '', password: '' };
    const emailValid = /.+@.+\..+/.test(email);
    if (!emailValid) nextErrors.email = 'Enter a valid email address';
    if (!password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    setFormError('');
    try {
      if (onLogin) {
        await onLogin({ username: email, password });
      }
    } catch (err) {
      setFormError(err?.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = () => {
    alert('Password reset link sent to your email (demo).');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
        {/* Left: Welcome panel */}
        <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 p-10 flex flex-col justify-center text-white">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white shadow-lg p-3 md:p-4 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="DiceBank logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">DiceBank</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Welcome back!</h2>
          <p className="text-sm text-white/90 max-w-sm mb-8">To keep connected with us, please log in with your personal info.</p>
          <button type="button" onClick={onSwitchRegister} className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-white/90 text-white font-semibold hover:bg-white/10 transition-colors">
            Create Account <ArrowRight size={16} />
          </button>
        </div>

        {/* Right: Form panel */}
        <div className="bg-white p-8 md:p-10">
          <h1 className="text-2xl font-bold text-indigo-900 tracking-tight mb-6">Sign In</h1>
          <div className="flex items-center gap-3 mb-4">
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1877F2] text-white hover:brightness-110" aria-label="Sign in with Facebook">
              <Facebook size={16} />
            </button>
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center bg-white ring-1 ring-gray-200 hover:bg-gray-50" aria-label="Sign in with Google">
              <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12  s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.087,4,24,4C12.955,4,4,12.955,4,24  s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.818C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657  C33.64,6.053,29.087,4,24,4C16.318,4,9.637,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36  c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.027C9.488,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.239-2.231,4.166-3.994,5.571c0.001-0.001,0.002-0.001,0.003-0.002  l6.19,5.238C36.982,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
            </button>
            <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center bg-[#0A66C2] text-white hover:brightness-110" aria-label="Sign in with LinkedIn">
              <Linkedin size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">or use your email to sign in</p>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="flex items-center gap-3">
                  <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700" onClick={forgotPassword}>
                    Forgot password?
                  </button>
                </div>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-full font-semibold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading
                  ? 'bg-indigo-300 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-700 hover:to-cyan-600'
              }`}
            >
              {loading ? 'Signing in…' : (
                <span className="inline-flex items-center justify-center gap-2">Sign In <ArrowRight size={16} /></span>
              )}
            </button>
            {formError ? (
              <p className="text-sm text-red-600 text-center">{formError}</p>
            ) : null}
          </form>
          <p className="text-xs text-gray-500 mt-4">Demo only: any email/password will sign you in.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
