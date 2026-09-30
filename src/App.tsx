import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CashflowProvider, useCashflow } from './context/CashflowContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StatCards } from './components/StatCards';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { MonthlyCharts } from './components/MonthlyCharts';
import { CategoryManager } from './components/CategoryManager';
import { UserManager } from './components/UserManager';
import { AuditLog } from './components/AuditLog';
import { ExportModal } from './components/ExportModal';
import { TitipanLogo } from './components/TitipanLogo';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { TrackingConsumerPortal } from './components/TrackingConsumerPortal';
import { TrackingManager } from './components/TrackingManager';
import { Transaction, TransactionType } from './types';
import teamTruckImage from './assets/images/titipan_team_truck_1790719702520.jpg';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Mail,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

function CashflowAppContent() {
  const {
    currentUser,
    isSuperAdmin,
    isConsumer,
    isApproved,
    signInWithEmailUser,
    registerWithEmailUser,
    resetPasswordForEmail,
    updateUserPassword,
    signInAsConsumer,
    roleOption,
    setRoleOption,
    authError,
    needsEmailConfirmation,
    passwordResetSent,
    passwordUpdated,
    clearAuthError,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log'>('arus_kas');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Path-based routing for required routes (/dashboard, /sign-up, /forgot-password, /update-password)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p === '/' || p === '' ? '/dashboard' : p;
    }
    return '/dashboard';
  });

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      clearAuthError();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p === '/' || p === '' ? '/dashboard' : p);
    };

    window.addEventListener('popstate', handlePopState);

    // If arriving from a password recovery link with hash token, route directly to /update-password
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      navigate('/update-password');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Form states for auth views
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
  const [localFormError, setLocalFormError] = useState<string | null>(null);

  // Login handler (/dashboard)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFormError(null);

    // Tracking Titipan quick lookup for consumer
    if (roleOption === 'tracking') {
      if (!loginEmail.trim()) return;
      signInAsConsumer(loginEmail.trim());
      return;
    }

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLocalFormError('Silakan masukkan email dan password.');
      return;
    }

    setIsFormSubmitting(true);
    clearAuthError();
    try {
      await signInWithEmailUser(loginEmail, loginPassword, 'admin');
      navigate('/dashboard');
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Sign up handler (/sign-up)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFormError(null);

    if (!registerEmail.trim() || !registerPassword.trim()) {
      setLocalFormError('Silakan isi seluruh kolom yang wajib diisi.');
      return;
    }

    if (registerPassword.length < 6) {
      setLocalFormError('Password minimal harus 6 karakter.');
      return;
    }

    if (confirmPassword && registerPassword !== confirmPassword) {
      setLocalFormError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsFormSubmitting(true);
    clearAuthError();
    try {
      await registerWithEmailUser(registerEmail, registerPassword, registerName, 'admin');
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Forgot password request handler (/forgot-password)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFormError(null);

    if (!resetEmail.trim()) {
      setLocalFormError('Silakan masukkan alamat email Anda.');
      return;
    }

    setIsFormSubmitting(true);
    clearAuthError();
    try {
      await resetPasswordForEmail(resetEmail);
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Update password handler (/update-password)
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFormError(null);

    if (!newPassword.trim()) {
      setLocalFormError('Silakan masukkan kata sandi baru Anda.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      setLocalFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsFormSubmitting(true);
    clearAuthError();
    try {
      await updateUserPassword(newPassword);
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleOpenNewTransaction = (type: TransactionType = 'income') => {
    setEditingTransaction(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  // 1. Loading screen during auth session check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EEF3F8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <TitipanLogo size="lg" variant="full" />
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-[#0e6e7d] border-t-transparent mt-4"></div>
          <p className="text-xs text-slate-500 font-medium">Memverifikasi sesi Titipan...</p>
        </div>
      </div>
    );
  }

  // 2. Public / Unauthenticated Views
  // If not logged in, render the requested path: /dashboard (sign-in), /sign-up, /forgot-password, or /update-password
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#EEF3F8] flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans antialiased">
        <main className="w-full max-w-5xl bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            {/* Left Column: Moving Team Photo with Carousel Indicator */}
            <div className="w-full">
              <div className="relative rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 aspect-[4/3] max-h-[560px] group">
                <img
                  src={teamTruckImage}
                  alt="Titipan Moving Team"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
                />

                {/* Subtle dark gradient overlay at bottom for slider indicator */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                {/* Carousel Slider Indicator matching screenshot */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  <span className="w-8 h-1.5 rounded-full bg-[#0e6e7d] shadow-sm inline-block" />
                  <span className="w-2.5 h-1.5 rounded-full bg-white/90 shadow-sm inline-block" />
                  <span className="w-2.5 h-1.5 rounded-full bg-white/90 shadow-sm inline-block" />
                  <span className="w-2.5 h-1.5 rounded-full bg-white/90 shadow-sm inline-block" />
                </div>
              </div>
            </div>

            {/* Right Column: Clean Elevated Card */}
            <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xs p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xl space-y-4">
              {/* VIEW 1: /sign-up */}
              {currentPath === '/sign-up' && (
                <>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <TitipanLogo size="md" variant="full" />
                    <h1 className="text-[25px] text-center font-extrabold text-[#0d4f5c] tracking-tight pt-0.5">
                      Daftar Akun Administrator
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Buat akun baru untuk mengelola arus kas dan proyek Titipan
                    </p>
                  </div>

                  {needsEmailConfirmation ? (
                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-left space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-sm text-teal-900">Pendaftaran Berhasil!</h4>
                          <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                            Kami telah mengirimkan tautan konfirmasi ke email <strong>{registerEmail}</strong>. Silakan periksa kotak masuk (inbox atau folder spam) Anda untuk mengonfirmasi akun sebelum login.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-2.5 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                      >
                        Kembali ke Halaman Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignUpSubmit} className="space-y-3 text-left">
                      {(authError || localFormError) && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="font-bold">{localFormError || authError}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="Masukkan nama lengkap Anda..."
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Email Administrator</label>
                        <input
                          type="email"
                          required
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="admin@titipan.com"
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-3.5 py-2.5 pr-11 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Konfirmasi Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password..."
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isFormSubmitting}
                        className="w-full py-3 px-4 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-extrabold text-sm rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {isFormSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'DAFTAR AKUN ADMINISTRATOR'
                        )}
                      </button>

                      <div className="pt-2 text-xs text-slate-500 font-medium text-center">
                        Sudah memiliki akun?{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="font-bold text-[#0e6e7d] hover:underline cursor-pointer"
                        >
                          Login disini
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* VIEW 2: /forgot-password */}
              {currentPath === '/forgot-password' && (
                <>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <TitipanLogo size="md" variant="full" />
                    <h1 className="text-[25px] text-center font-extrabold text-[#0d4f5c] tracking-tight pt-0.5">
                      Lupa Kata Sandi
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Masukkan email akun administrator Anda untuk mengatur ulang kata sandi
                    </p>
                  </div>

                  {passwordResetSent ? (
                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-left space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-sm text-teal-900">Tautan Pemulihan Dikirim!</h4>
                          <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                            Kami telah mengirimkan tautan reset kata sandi ke <strong>{resetEmail}</strong>. Silakan periksa inbox email Anda dan klik tautan untuk mengatur kata sandi baru.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-2.5 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                      >
                        Kembali ke Halaman Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-left">
                      {(authError || localFormError) && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="font-bold">{localFormError || authError}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Email Administrator</label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="admin@titipan.com"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isFormSubmitting}
                        className="w-full py-3 px-4 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-extrabold text-sm rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {isFormSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'KIRIM TAUTAN PEMULIHAN'
                        )}
                      </button>

                      <div className="pt-2 text-xs text-slate-500 font-medium text-center">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="font-bold text-[#0e6e7d] hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Kembali ke Halaman Login</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* VIEW 3: /update-password */}
              {currentPath === '/update-password' && (
                <>
                  <div className="flex flex-col items-center text-center space-y-1">
                    <TitipanLogo size="md" variant="full" />
                    <h1 className="text-[25px] text-center font-extrabold text-[#0d4f5c] tracking-tight pt-0.5">
                      Perbarui Kata Sandi
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Silakan masukkan kata sandi baru untuk akun administrator Anda
                    </p>
                  </div>

                  {passwordUpdated ? (
                    <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-left space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-sm text-teal-900">Kata Sandi Berhasil Diperbarui!</h4>
                          <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                            Kata sandi akun Anda telah berhasil diubah. Anda sekarang dapat masuk menggunakan kata sandi baru.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-2.5 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                      >
                        Masuk ke Dashboard
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3 text-left">
                      {(authError || localFormError) && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="font-bold">{localFormError || authError}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Kata Sandi Baru</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-3.5 py-2.5 pr-11 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Ulangi Kata Sandi Baru</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Konfirmasi kata sandi baru"
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isFormSubmitting}
                        className="w-full py-3 px-4 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-extrabold text-sm rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        {isFormSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'SIMPAN KATA SANDI BARU'
                        )}
                      </button>

                      <div className="pt-2 text-xs text-slate-500 font-medium text-center">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="font-bold text-[#0e6e7d] hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Kembali ke Halaman Login</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* VIEW 4: /dashboard (Default Sign In View) */}
              {currentPath !== '/sign-up' && currentPath !== '/forgot-password' && currentPath !== '/update-password' && (
                <>
                  {/* Brand Logo & Header */}
                  <div className="flex flex-col items-center text-center space-y-1">
                    <TitipanLogo size="md" variant="full" />
                    <h1 className="text-[25px] text-center font-extrabold text-[#0d4f5c] tracking-tight pt-0.5">
                      {roleOption === 'tracking' ? 'Lacak Pesanan Titipan' : 'Login Sistem Titipan'}
                    </h1>
                  </div>

                  {/* 2-Option Role User Login Selector */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F6F9FB] p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    {/* Option 1: Tracking Titipan */}
                    <button
                      type="button"
                      onClick={() => {
                        setRoleOption('tracking');
                        clearAuthError();
                      }}
                      className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border font-bold text-xs sm:text-sm ${
                        roleOption === 'tracking'
                          ? 'bg-[#0e6e7d] text-white border-[#0e6e7d] shadow-sm ring-2 ring-[#0e6e7d]/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>Tracking Titipan</span>
                    </button>

                    {/* Option 2: Administrator */}
                    <button
                      type="button"
                      onClick={() => {
                        setRoleOption('admin');
                        clearAuthError();
                      }}
                      className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border font-bold text-xs sm:text-sm ${
                        roleOption === 'admin'
                          ? 'bg-[#0e6e7d] text-white border-[#0e6e7d] shadow-sm ring-2 ring-[#0e6e7d]/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Administrator</span>
                    </button>
                  </div>

                  {/* Error Notice if any */}
                  {(authError || localFormError) && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="font-bold">{localFormError || authError}</p>
                    </div>
                  )}

                  {/* Email / Password Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {roleOption === 'tracking' ? 'Nomor Resi / Email Konsumen' : 'Email Administrator'}
                      </label>
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={
                          roleOption === 'tracking'
                            ? 'Masukkan nomor resi atau email Anda...'
                            : 'admin@titipan.com'
                        }
                        className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                      />
                    </div>

                    {/* Password field only shown for Administrator */}
                    {roleOption === 'admin' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            Password Administrator
                          </label>
                          <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-[11px] font-bold text-[#0e6e7d] hover:underline cursor-pointer"
                          >
                            Lupa kata sandi?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 pr-11 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Primary CTA Button: LOGIN */}
                    <button
                      type="submit"
                      disabled={isFormSubmitting}
                      className="w-full py-3 px-4 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-extrabold text-sm rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
                    >
                      {isFormSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : roleOption === 'tracking' ? (
                        'LACAK PESANAN SEKARANG'
                      ) : (
                        'LOGIN ADMINISTRATOR'
                      )}
                    </button>
                  </form>

                  {/* Sign Up Link for Administrator */}
                  {roleOption === 'admin' && (
                    <div className="pt-1 text-xs text-slate-500 font-medium text-center">
                      Belum memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/sign-up')}
                        className="font-bold text-[#0e6e7d] hover:underline cursor-pointer"
                      >
                        Daftar disini
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Consumer portal (if consumer user)
  if (isConsumer) {
    return (
      <div className="min-h-screen bg-[#EEF3F8] text-slate-900 font-sans antialiased flex flex-col">
        <header className="bg-[#FFFDFA] border-b border-slate-200 sticky top-0 z-30 shadow-2xs w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-3">
              <TitipanLogo size="sm" variant="full" />
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                PORTAL KONSUMEN
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Keluar ke Login
            </button>
          </div>
        </header>

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          <TrackingConsumerPortal />
        </main>
      </div>
    );
  }

  // 4. Authenticated Dashboard (Private Area)
  return (
    <div className="min-h-screen bg-[#EEF3F8] text-slate-900 font-sans antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-300">
        <div className="flex-1">
          {/* Top Navbar */}
          <Navbar
            onToggleSidebar={() => setIsSidebarOpen(true)}
            activeTab={activeTab}
            onOpenNewTransaction={handleOpenNewTransaction}
          />

          {/* Page Content Container */}
          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {activeTab === 'arus_kas' && (
              <>
                {/* Financial Metric Cards */}
                <StatCards />

                {/* Unified All-in-One Transaction Card */}
                <TransactionList
                  onEdit={handleOpenEditTransaction}
                  onOpenNew={handleOpenNewTransaction}
                  onExport={() => setIsExportOpen(true)}
                />
              </>
            )}

            {activeTab === 'tracking' && <TrackingManager />}

            {activeTab === 'laporan_grafik' && (
              <MonthlyCharts onExport={() => setIsExportOpen(true)} />
            )}

            {activeTab === 'kategori' && <CategoryManager />}

            {activeTab === 'pengguna' && isSuperAdmin && <UserManager />}

            {activeTab === 'audit_log' && <AuditLog />}
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-[#FFFDFA] border-t border-slate-200 mt-12 py-5 no-print w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <TitipanLogo size="sm" variant="icon-only" />
              <span className="font-bold text-slate-700">Cashflow Titipan</span>
              <span>— PT. Tiba-Tiba Pindahan (Moving & Storage)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={editingTransaction}
        defaultType={modalDefaultType}
      />

      {/* Export Modal (PDF / Excel) */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CashflowProvider>
        <CashflowAppContent />
      </CashflowProvider>
    </AuthProvider>
  );
}
