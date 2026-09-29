import React, { useState } from 'react';
import {
  Users,
  Crown,
  Shield,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Mail,
  UserCheck,
  UserX,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserProfile } from '../types';

export const UserManager: React.FC = () => {
  const {
    usersList,
    preapprovedList,
    updateUserRole,
    approveUser,
    rejectUser,
    deleteUserAccount,
    preapproveEmail,
    removePreapproval,
  } = useCashflow();
  const { currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'admin' | 'superadmin' | 'preapproved'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  // Pre-approval Modal state
  const [isPreapproveModalOpen, setIsPreapproveModalOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingPreapproval, setIsSubmittingPreapproval] = useState<boolean>(false);

  // Reject Modal state
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Akses tidak diberikan oleh Superadmin');

  // Counts
  const pendingUsers = usersList.filter((u) => u.status === 'pending');
  const approvedUsers = usersList.filter((u) => u.status !== 'pending' && u.status !== 'rejected');
  const adminUsers = usersList.filter((u) => u.role === 'admin' && u.status !== 'pending');
  const superadminUsers = usersList.filter((u) => u.role === 'superadmin' && u.status !== 'pending');
  const rejectedUsers = usersList.filter((u) => u.status === 'rejected');

  // Filtered list based on active tab and search
  const filteredUsers = usersList.filter((user) => {
    // Tab filter
    if (activeTab === 'pending' && user.status !== 'pending') return false;
    if (activeTab === 'admin' && (user.role !== 'admin' || user.status === 'pending')) return false;
    if (activeTab === 'superadmin' && (user.role !== 'superadmin' || user.status === 'pending')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = user.displayName?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }

    return true;
  });

  const filteredPreapproved = preapprovedList.filter((item) => {
    if (searchQuery.trim()) {
      return item.email.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const handleApprove = async (targetUid: string, role: UserRole = 'admin') => {
    setProcessingUid(targetUid);
    try {
      await approveUser(targetUid, role);
    } catch (err: any) {
      console.error('Approval failed:', err);
      alert(err.message || 'Gagal menyetujui akun');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setProcessingUid(rejectingUser.uid);
    try {
      await rejectUser(rejectingUser.uid, rejectionReason);
      setRejectingUser(null);
    } catch (err: any) {
      console.error('Rejection failed:', err);
      alert(err.message || 'Gagal menolak akun');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    setProcessingUid(targetUid);
    try {
      await updateUserRole(targetUid, newRole);
    } catch (err: any) {
      console.error('Role update failed:', err);
      alert(err.message || 'Gagal memperbarui peran');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleDeleteUser = async (targetUid: string, name: string) => {
    if (!window.confirm(`Hapus data akun ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setProcessingUid(targetUid);
    try {
      await deleteUserAccount(targetUid);
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || 'Gagal menghapus akun');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleAddPreapproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setModalError('Masukkan alamat email yang valid.');
      return;
    }
    setModalError(null);
    setIsSubmittingPreapproval(true);
    try {
      await preapproveEmail(newEmail.trim(), newRole);
      setNewEmail('');
      setIsPreapproveModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Gagal menambahkan email pra-verifikasi');
    } finally {
      setIsSubmittingPreapproval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#FFFDFA] rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
              <Crown className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Manajemen Pengguna &amp; Verifikasi Akun Admin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola otorisasi akun email, berikan verifikasi admin baru, dan atur peran Superadmin
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreapproveModalOpen(true)}
            className="px-3.5 py-2 bg-[#117181] hover:bg-[#0c4f5b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Pra-Verifikasi Email Admin</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pending */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
              : 'bg-[#FFFDFA] border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1 flex items-center gap-2">
            <span>{pendingUsers.length}</span>
            {pendingUsers.length > 0 && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 animate-pulse">
                Perlu Tindakan
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Permohonan akun baru</p>
        </button>

        {/* Card 2: Active Admin */}
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-[#f0f8f9] border-[#b5e1e7] ring-2 ring-[#117181]/40 shadow-xs'
              : 'bg-[#FFFDFA] border-slate-200 hover:border-[#b5e1e7]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#0c4f5b]">
            <span>Admin Terverifikasi</span>
            <Shield className="w-4 h-4 text-[#117181]" />
          </div>
          <div className="text-2xl font-black text-[#0c4f5b] mt-1">{adminUsers.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Petugas pencatatan kas</p>
        </button>

        {/* Card 3: Superadmin */}
        <button
          type="button"
          onClick={() => setActiveTab('superadmin')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'superadmin'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
              : 'bg-[#FFFDFA] border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Superadmin</span>
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{superadminUsers.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Otoritas penuh sistem</p>
        </button>

        {/* Card 4: Preapproved Emails */}
        <button
          type="button"
          onClick={() => setActiveTab('preapproved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'preapproved'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/40 shadow-xs'
              : 'bg-[#FFFDFA] border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Pra-Verifikasi Email</span>
            <Mail className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{preapprovedList.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Auto-verifikasi saat login</p>
        </button>
      </div>

      {/* Main Tab Controls & Search Bar */}
      <div className="bg-[#FFFDFA] rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Navigation Filter Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-400 text-teal-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Menunggu Verifikasi</span>
              {pendingUsers.length > 0 && (
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-black">
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#117181] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Akun ({usersList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#117181] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin ({adminUsers.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('superadmin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'superadmin'
                  ? 'bg-[#117181] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Superadmin ({superadminUsers.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preapproved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preapproved'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pra-Verifikasi ({preapprovedList.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#117181] focus:bg-[#FFFDFA] transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* VIEW: PRE-APPROVED EMAILS LIST */}
      {activeTab === 'preapproved' ? (
        <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Email Pra-Verifikasi ({filteredPreapproved.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pengguna dengan email ini akan langsung terverifikasi secara otomatis saat pertama kali login
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPreapproveModalOpen(true)}
              className="px-3 py-1 bg-[#117181] hover:bg-[#0c4f5b] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Email</span>
            </button>
          </div>

          {filteredPreapproved.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Mail className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Belum ada email yang di-pra-verifikasi</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Anda dapat menambahkan email staf Titipan agar mereka tidak perlu menunggu persetujuan manual saat login.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPreapproved.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-[#117181]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ditambahkan oleh {item.addedBy} • Peran otomatis:{' '}
                        <strong className="text-slate-700 uppercase">{item.role}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                      Siap Otomatis Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => removePreapproval(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus dari daftar pra-verifikasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW: USERS LIST (PENDING / APPROVED / ALL) */
        <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Header Strip */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === 'pending'
                ? `Permohonan Akses Masuk Menunggu Persetujuan (${pendingUsers.length})`
                : `Daftar Pengguna (${filteredUsers.length})`}
            </span>
            <span className="text-[11px] text-slate-400">
              Tersinkronisasi real-time dengan Firebase
            </span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6 text-[#117181]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {activeTab === 'pending'
                  ? 'Tidak Ada Akun yang Menunggu Persetujuan'
                  : 'Tidak ada data pengguna yang cocok'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'Semua akun telah terverifikasi atau belum ada pendaftaran baru.'
                  : 'Silakan ubah kata kunci pencarian atau tab filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isUserSuperAdmin = user.role === 'superadmin';
                const isSelf = currentUser?.uid === user.uid;
                const isPending = user.status === 'pending';
                const isRejected = user.status === 'rejected';
                const isProcessing = processingUid === user.uid;

                return (
                  <div
                    key={user.uid}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isPending
                        ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-400'
                        : isRejected
                        ? 'bg-rose-50/20 hover:bg-rose-50/40 border-l-4 border-l-rose-400'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* User Identity Column */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-11 h-11 rounded-full ring-2 ring-[#117181]/30 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#117181] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-inner">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 leading-tight">
                            {user.displayName}
                          </span>

                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded border border-teal-200">
                              Akun Anda
                            </span>
                          )}

                          {/* Verification Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Menunggu Persetujuan</span>
                            </span>
                          )}

                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 uppercase tracking-wider">
                              <X className="w-3 h-3 text-rose-600" />
                              <span>Ditolak</span>
                            </span>
                          )}

                          {!isPending && !isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Terverifikasi</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.email}</span>
                          </span>

                          {user.approvedBy && (
                            <span className="text-[11px] text-slate-400">
                              Disetujui oleh: <strong>{user.approvedBy}</strong>
                            </span>
                          )}

                          {user.createdAt && (
                            <span className="text-[11px] text-slate-400">
                              Mendaftar: {new Date(user.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls Column */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                      {/* PENDING ACTIONS: Superadmin can Approve or Reject */}
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(user.uid, 'admin')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui sebagai Admin</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(user.uid, 'superadmin')}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-teal-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Jadikan Superadmin</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setRejectingUser(user)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        /* ALREADY VERIFIED USER ACTIONS */
                        <div className="flex items-center gap-2">
                          {/* Role Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isUserSuperAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-[#d9eff2] text-[#0c4f5b] border border-[#b5e1e7]'
                            }`}
                          >
                            {isUserSuperAdmin ? (
                              <Crown className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-[#117181]" />
                            )}
                            <span>{isUserSuperAdmin ? 'Superadmin' : 'Admin'}</span>
                          </span>

                          {/* Role Switch Toggle (Superadmin only) */}
                          {isSuperAdmin && !isSelf && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                handleRoleChange(user.uid, isUserSuperAdmin ? 'admin' : 'superadmin')
                              }
                              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                              title={`Ubah peran menjadi ${isUserSuperAdmin ? 'Admin' : 'Superadmin'}`}
                            >
                              <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                              <span>{isUserSuperAdmin ? 'Jadikan Admin' : 'Jadikan Superadmin'}</span>
                            </button>
                          )}

                          {/* Revoke / Suspend Account */}
                          {isSuperAdmin && !isSelf && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRejectingUser(user)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Tangguhkan / Cabut Izin Akses"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Account */}
                          {isSuperAdmin && !isSelf && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleDeleteUser(user.uid, user.displayName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: PRE-APPROVE NEW EMAIL */}
      {isPreapproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFDFA] rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                  <Mail className="w-5 h-5 text-[#117181]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pra-Verifikasi Email Admin</h3>
                  <p className="text-xs text-slate-500">Izin otomatis saat login dengan Google</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreapproveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPreapproval} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Akun Google Petugas / Admin:
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contoh: nama.petugas@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#117181] focus:bg-[#FFFDFA] text-slate-800 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Saat pemilik email ini login, akun mereka akan langsung aktif sebagai Admin tanpa perlu menunggu persetujuan manual.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran Akses:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-[#117181] text-white border-[#117181] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Admin Operasional
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('superadmin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newRole === 'superadmin'
                        ? 'bg-amber-500 text-teal-950 font-black border-amber-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Superadmin
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPreapproveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPreapproval}
                  className="px-5 py-2 bg-[#117181] hover:bg-[#0c4f5b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingPreapproval ? 'Menyimpan...' : 'Simpan Pra-Verifikasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT / SUSPEND CONFIRMATION */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFDFA] rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">
                Tolak / Tangguhkan Akses Akun
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menolak permohonan akses dari{' '}
                <strong className="text-slate-800">{rejectingUser.displayName}</strong> ({rejectingUser.email})?
              </p>
            </div>

            <div className="text-left">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Alasan Penolakan (ditampilkan kepada pengguna):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingUid === rejectingUser.uid}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {processingUid === rejectingUser.uid ? 'Memproses...' : 'Ya, Tolak Akses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
