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
import { testConnection } from './firebase';
import teamTruckImage from './assets/images/titipan_team_truck_1790719702520.jpg';
import {
  LogIn,
  Globe,
  User,
  AlertTriangle,
  Eye,
  EyeOff,
  Truck,
  ShieldCheck,
  Search,
} from 'lucide-react';

function CashflowAppContent() {
  const {
    currentUser,
    isSuperAdmin,
    isConsumer,
    isApproved,
    activeRole,
    signIn,
    signInWithEmailUser,
    registerWithEmailUser,
    signInAsConsumer,
    roleOption,
    setRoleOption,
    authError,
    authErrorCode,
    clearAuthError,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log'>('arus_kas');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Form states for login screen
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    testConnection();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch {
      // Handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    // For consumer tracking portal, allow instant lookup by resi or consumer email
    if (roleOption === 'tracking' && !loginPassword.trim() && !isRegisterMode) {
      signInAsConsumer(loginEmail.trim());
      return;
    }

    if (!loginPassword.trim()) return;

    setIsFormSubmitting(true);
    clearAuthError();
    try {
      if (isRegisterMode) {
        await registerWithEmailUser(loginEmail, loginPassword, registerName, roleOption);
      } else {
        await signInWithEmailUser(loginEmail, loginPassword, roleOption);
      }
    } catch {
      // If consumer email/password fails or operation-not-allowed in Firebase console, allow instant tracking access
      if (roleOption === 'tracking' && !isRegisterMode) {
        signInAsConsumer(loginEmail.trim());
      }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EEF3F8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <TitipanLogo size="lg" variant="full" />
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-[#0e6e7d] border-t-transparent mt-4"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat sistem Titipan...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show exact split screen matching login1.png
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

            {/* Right Column: Clean Elevated Login Card */}
            <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xs p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xl space-y-4">
              {/* Brand Logo & Header */}
              <div className="flex flex-col items-center text-center space-y-1">
                <TitipanLogo size="md" variant="full" />
                <h1 className="text-[25px] text-center font-extrabold text-[#0d4f5c] tracking-tight pt-0.5">
                  {isRegisterMode ? 'Daftar Akun Titipan' : 'Login Sistem Titipan'}
                </h1>
              </div>

              {/* 2-Option Role User Login Selector */}
              <div className="grid grid-cols-2 gap-2 bg-[#F6F9FB] p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  {/* Option 1: Tracking Titipan (user consumer) */}
                  <button
                    type="button"
                    onClick={() => {
                      setRoleOption('tracking');
                      clearAuthError();
                    }}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between relative border ${
                      roleOption === 'tracking'
                        ? 'bg-[#0e6e7d] text-white border-[#0e6e7d] shadow-md ring-2 ring-[#0e6e7d]/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          roleOption === 'tracking'
                            ? 'bg-white/20 text-white'
                            : 'bg-teal-50 text-[#0e6e7d]'
                        }`}
                      >
                        <Truck className="w-4 h-4 shrink-0" />
                      </div>
                      {roleOption === 'tracking' ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm leading-snug">
                        Tracking Titipan
                      </div>
                      <div
                        className={`text-[11px] font-medium leading-tight mt-0.5 ${
                          roleOption === 'tracking' ? 'text-teal-100' : 'text-slate-500'
                        }`}
                      >
                        (user consumer)
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Administrator (superadmin & admin) */}
                  <button
                    type="button"
                    onClick={() => {
                      setRoleOption('admin');
                      clearAuthError();
                    }}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between relative border ${
                      roleOption === 'admin'
                        ? 'bg-[#0e6e7d] text-white border-[#0e6e7d] shadow-md ring-2 ring-[#0e6e7d]/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          roleOption === 'admin'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                      </div>
                      {roleOption === 'admin' ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm leading-snug">
                        Administrator
                      </div>
                      <div
                        className={`text-[11px] font-medium leading-tight mt-0.5 ${
                          roleOption === 'admin' ? 'text-teal-100' : 'text-slate-500'
                        }`}
                      >
                        (superadmin & admin)
                      </div>
                    </div>
                  </button>
                </div>

              {/* Error Notice if any */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">{authError}</p>
                    {authErrorCode === 'auth/unauthorized-domain' && (
                      <p className="text-[11px] text-rose-700">
                        Domain Anda: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold">{currentDomain}</code>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                {isRegisterMode && (
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
                )}

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
                        ? 'Contoh: TTP-2026-0929-JKT atau nama@email.com'
                        : 'admin@titipan.com atau email Superadmin'
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] transition-all"
                  />
                  {roleOption === 'tracking' && !isRegisterMode && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span>Resi aktif:</span>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('TTP-2026-0929-JKT')}
                        className="text-[#0e6e7d] font-bold hover:underline bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70 cursor-pointer"
                      >
                        TTP-2026-0929-JKT
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginEmail('TTP-2026-0915-BDG')}
                        className="text-[#0e6e7d] font-bold hover:underline bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70 cursor-pointer"
                      >
                        TTP-2026-0915-BDG
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {roleOption === 'tracking'
                      ? isRegisterMode
                        ? 'Password'
                        : 'Password (Opsional untuk Lacak Cepat)'
                      : 'Password Administrator'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={isRegisterMode || roleOption === 'admin'}
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

                {/* Primary CTA Button: LOGIN */}
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="w-full py-3 px-4 bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-extrabold text-sm rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {isFormSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isRegisterMode ? (
                    roleOption === 'tracking' ? 'DAFTAR AKUN KONSUMEN' : 'DAFTAR AKUN ADMINISTRATOR'
                  ) : roleOption === 'tracking' ? (
                    loginPassword.trim() ? 'LOGIN KONSUMEN' : 'LACAK PESANAN SEKARANG'
                  ) : (
                    'LOGIN ADMINISTRATOR'
                  )}
                </button>
              </form>

              {/* Divider: atau */}
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 mx-3 text-xs text-slate-400 font-medium">atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-2xs transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isSigningIn
                    ? 'Menghubungkan...'
                    : roleOption === 'admin'
                    ? 'Login Administrator dengan Google'
                    : 'Masuk Konsumen dengan Google'}
                </span>
              </button>

              {/* Register / Login Toggle */}
              <div className="pt-0.5 text-xs text-slate-500 font-medium text-center">
                {isRegisterMode ? (
                  <span>
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        clearAuthError();
                      }}
                      className="font-bold text-[#0e6e7d] hover:underline cursor-pointer"
                    >
                      Login disini
                    </button>
                  </span>
                ) : (
                  <span>
                    Belum memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        clearAuthError();
                      }}
                      className="font-bold text-[#0d4f5c] hover:underline cursor-pointer"
                    >
                      Register disini
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If consumer role, show the dedicated Tracking Titipan portal
  if (isConsumer) {
    return <TrackingConsumerPortal />;
  }

  // If administrator but awaiting Superadmin approval or rejected, show the approval screen
  if (!isApproved) {
    return <PendingApprovalScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FFFDFA] flex flex-col md:flex-row w-full text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
      />

      {/* Main Content Area (Offset by sidebar width md:pl-64) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 min-h-screen justify-between">
        <div className="w-full">
          {/* Top Bar Header */}
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

                {/* Unified All-in-One Transaction Card (Actions + Filter + Transactions Table) */}
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
