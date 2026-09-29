import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TitipanLogo } from './TitipanLogo';

export const PendingApprovalScreen: React.FC = () => {
  const { currentUser, userProfile, isRejected, signOut, checkApprovalStatus, signInAsDemo } = useAuth();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setLastCheckMessage(null);
    try {
      await checkApprovalStatus();
      setLastCheckMessage('Status akun berhasil diperbarui.');
      setTimeout(() => setLastCheckMessage(null), 3000);
    } catch {
      setLastCheckMessage('Gagal menyinkronkan status. Coba sesaat lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Pengguna Titipan';
  const email = userProfile?.email || currentUser?.email || '-';

  return (
    <div className="min-h-screen bg-[#FFFDFA] flex flex-col justify-between text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-[#FFFDFA] border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
        <TitipanLogo size="md" variant="full" />
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Keluar</span>
        </button>
      </header>

      {/* Main Waiting Card Container */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
          {/* Subtle top brand accent bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#117181] to-[#0c4f5b]" />

          {/* Status Icon */}
          <div className="mx-auto flex items-center justify-center">
            {isRejected ? (
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner relative">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
            )}
          </div>

          {/* Status Headings */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
              {isRejected ? (
                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full">
                  Akses Belum Disetujui
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Menunggu Verifikasi Superadmin</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isRejected
                ? 'Permohonan Akses Belum Diizinkan'
                : 'Akun Anda Sedang Diverifikasi'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {isRejected
                ? userProfile?.rejectedReason ||
                  'Akun ini saat ini tidak memiliki izin akses ke sistem keuangan Titipan. Silakan hubungi Superadmin untuk info lebih lanjut.'
                : 'Untuk menjaga integritas dan keamanan pencatatan kas armada Titipan, akun email baru harus disetujui oleh Superadmin sebelum dapat masuk sebagai Admin.'}
            </p>
          </div>

          {/* User Account Info Card */}
          <div className="bg-[#FFFDFA] rounded-2xl p-4 border border-slate-200 text-left space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Data Akun Terdaftar
            </div>

            <div className="flex items-center gap-3">
              {userProfile?.photoURL || (currentUser as any)?.photoURL ? (
                <img
                  src={userProfile?.photoURL || (currentUser as any)?.photoURL}
                  alt={displayName}
                  className="w-11 h-11 rounded-full ring-2 ring-[#117181]/20 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#117181] text-white font-black flex items-center justify-center text-sm shadow-inner">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-2">
                  <span>{displayName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Calon Admin
                </span>
              </div>
            </div>
          </div>

          {/* Real-time sync note */}
          {!isRejected && (
            <div className="p-3 rounded-xl bg-[#f0f8f9] border border-[#b5e1e7] text-xs text-[#0c4f5b] flex items-center gap-2 text-left">
              <CheckCircle className="w-4 h-4 text-[#117181] shrink-0" />
              <span>
                <strong>Tersinkronisasi Otomatis:</strong> Halaman ini akan langsung terbuka menjadi dashboard admin begitu disetujui Superadmin.
              </span>
            </div>
          )}

          {lastCheckMessage && (
            <div className="text-xs font-semibold text-teal-800 bg-teal-50 py-1.5 px-3 rounded-lg border border-teal-200">
              {lastCheckMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {!isRejected && (
              <button
                type="button"
                disabled={isChecking}
                onClick={handleManualCheck}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#117181] hover:bg-[#0c4f5b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Memeriksa...' : 'Cek Status Sekarang'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={signOut}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti Akun / Keluar</span>
            </button>
          </div>

          {/* Testing / Demo Shortcut to Switch to Superadmin */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Ingin Menguji Fitur Persetujuan?</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Anda dapat beralih ke akun <strong>Superadmin</strong> untuk melihat daftar antrean dan memberikan persetujuan verifikasi akun admin ini.
              </p>
              <button
                type="button"
                onClick={() => signInAsDemo('superadmin')}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-teal-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Masuk sebagai Superadmin &amp; Setujui Akun</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        © {new Date().getFullYear()} Cashflow Titipan — PT. Tiba-Tiba Pindahan | Moving &amp; Storage
      </footer>
    </div>
  );
};
