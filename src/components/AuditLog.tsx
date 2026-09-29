import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  Calendar,
  ArrowRight,
  Clock,
  User,
  Shield,
  Crown,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { useAuth } from '../context/AuthContext';
import { AuditLogEntry, AuditActionType } from '../types';
import { formatRupiah } from '../utils/formatters';

export const AuditLog: React.FC = () => {
  const { auditLogs } = useCashflow();
  const { isSuperAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Extract unique actors for filter dropdown
  const uniqueActors = useMemo(() => {
    const map = new Map<string, { uid: string; name: string; email: string }>();
    auditLogs.forEach((log) => {
      if (log.actorUid && !map.has(log.actorUid)) {
        map.set(log.actorUid, {
          uid: log.actorUid,
          name: log.actorName,
          email: log.actorEmail,
        });
      }
    });
    return Array.from(map.values());
  }, [auditLogs]);

  // KPI Counts
  const stats = useMemo(() => {
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let userAuth = 0;

    auditLogs.forEach((log) => {
      if (log.action === 'create_transaction') created++;
      else if (log.action === 'update_transaction') updated++;
      else if (log.action === 'delete_transaction') deleted++;
      else userAuth++;
    });

    return { total: auditLogs.length, created, updated, deleted, userAuth };
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return auditLogs.filter((log) => {
      // Action Filter
      if (selectedAction !== 'all') {
        if (selectedAction === 'transactions' && !log.action.includes('transaction')) return false;
        if (selectedAction === 'create' && log.action !== 'create_transaction') return false;
        if (selectedAction === 'update' && log.action !== 'update_transaction') return false;
        if (selectedAction === 'delete' && log.action !== 'delete_transaction') return false;
        if (selectedAction === 'auth' && log.action.includes('transaction')) return false;
      }

      // Actor Filter
      if (selectedActor !== 'all' && log.actorUid !== selectedActor) {
        return false;
      }

      // Date Filter
      if (dateFilter === 'today') {
        if (!log.timestamp.startsWith(todayStr)) return false;
      } else if (dateFilter === '7days') {
        if (new Date(log.timestamp) < sevenDaysAgo) return false;
      } else if (dateFilter === 'month') {
        if (!log.timestamp.startsWith(monthPrefix)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSummary = log.summary.toLowerCase().includes(q);
        const matchActor = log.actorName.toLowerCase().includes(q) || log.actorEmail.toLowerCase().includes(q);
        const matchDesc = log.details?.description?.toLowerCase().includes(q);
        const matchRef = log.details?.referenceNumber?.toLowerCase().includes(q);
        const matchCat = log.details?.categoryName?.toLowerCase().includes(q);
        if (!matchSummary && !matchActor && !matchDesc && !matchRef && !matchCat) return false;
      }

      return true;
    });
  }, [auditLogs, selectedAction, selectedActor, dateFilter, searchQuery]);

  // Format date helper
  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const dateStr = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `${dateStr}, ${timeStr} WIB`;
    } catch {
      return iso;
    }
  };

  // Relative time helper
  const getRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      if (diffMin < 1) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari yang lalu`;
    } catch {
      return '';
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Waktu', 'Aksi', 'Petugas', 'Email Petugas', 'Peran', 'Target', 'Ringkasan Aktivitas'];
    const rows = filteredLogs.map((log) => [
      `"${formatTimestamp(log.timestamp)}"`,
      `"${log.actionLabel}"`,
      `"${log.actorName.replace(/"/g, '""')}"`,
      `"${log.actorEmail}"`,
      `"${log.actorRole.toUpperCase()}"`,
      `"${log.targetType || '-'}"`,
      `"${log.summary.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Log_Titipan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get action visual styling
  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'create_transaction':
        return {
          icon: PlusCircle,
          colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          nodeBorder: 'border-emerald-500 ring-4 ring-emerald-50/80',
          nodeBg: 'bg-emerald-50',
          nodeText: 'text-emerald-600',
          dotClass: 'bg-emerald-500',
          label: 'Pencatatan Baru',
        };
      case 'update_transaction':
        return {
          icon: Edit3,
          colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
          nodeBorder: 'border-amber-500 ring-4 ring-amber-50/80',
          nodeBg: 'bg-amber-50',
          nodeText: 'text-amber-600',
          dotClass: 'bg-amber-500',
          label: 'Perubahan Data',
        };
      case 'delete_transaction':
        return {
          icon: Trash2,
          colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
          nodeBorder: 'border-rose-500 ring-4 ring-rose-50/80',
          nodeBg: 'bg-rose-50',
          nodeText: 'text-rose-600',
          dotClass: 'bg-rose-500',
          label: 'Penghapusan Transaksi',
        };
      case 'approve_user':
        return {
          icon: UserCheck,
          colorClass: 'text-teal-800 bg-teal-50 border-teal-200',
          nodeBorder: 'border-[#117181] ring-4 ring-teal-50/80',
          nodeBg: 'bg-teal-50',
          nodeText: 'text-[#117181]',
          dotClass: 'bg-[#117181]',
          label: 'Verifikasi Disetujui',
        };
      case 'reject_user':
        return {
          icon: UserX,
          colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
          nodeBorder: 'border-rose-500 ring-4 ring-rose-50/80',
          nodeBg: 'bg-rose-50',
          nodeText: 'text-rose-600',
          dotClass: 'bg-rose-500',
          label: 'Akses Ditolak',
        };
      case 'change_user_role':
        return {
          icon: ShieldCheck,
          colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
          nodeBorder: 'border-purple-500 ring-4 ring-purple-50/80',
          nodeBg: 'bg-purple-50',
          nodeText: 'text-purple-600',
          dotClass: 'bg-purple-500',
          label: 'Ubah Peran Hak Akses',
        };
      case 'preapprove_email':
        return {
          icon: Mail,
          colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          nodeBorder: 'border-indigo-500 ring-4 ring-indigo-50/80',
          nodeBg: 'bg-indigo-50',
          nodeText: 'text-indigo-600',
          dotClass: 'bg-indigo-500',
          label: 'Pra-Verifikasi Email',
        };
      default:
        return {
          icon: History,
          colorClass: 'text-slate-700 bg-slate-50 border-slate-200',
          nodeBorder: 'border-slate-400 ring-4 ring-slate-100',
          nodeBg: 'bg-slate-50',
          nodeText: 'text-slate-600',
          dotClass: 'bg-slate-500',
          label: 'Aktivitas Kas',
        };
    }
  };

  return (
    <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* 1. Header Banner */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FFFDFA]">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
            <History className="w-4 h-4 text-[#117181]" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight flex items-center gap-2">
              <span>Audit Log &amp; Riwayat Perubahan Kas</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Transparan
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mencatat secara otomatis setiap tindakan pencatatan, koreksi nominal, penghapusan, dan persetujuan akun admin
            </p>
          </div>
        </div>
      </div>

      {/* 2. Embedded KPI Counters Strip */}
      <div className="p-3 sm:px-5 sm:py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Total Catatan</span>
            <History className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Semua riwayat sistem</p>
        </div>

        {/* Created */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Transaksi Baru</span>
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{stats.created}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Pemasukan &amp; pengeluaran</p>
        </div>

        {/* Updated / Corrected */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>Perubahan Data</span>
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">{stats.updated}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Koreksi nominal / rincian</p>
        </div>

        {/* Deleted */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
            <span>Penghapusan</span>
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">{stats.deleted}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Data yang dibatalkan</p>
        </div>
      </div>

      {/* 3. Embedded Filter and Search Bar */}
      <div className="p-3 sm:px-5 sm:py-3 bg-[#FFFDFA] border-b border-slate-100 space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Action Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 p-0.5 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setSelectedAction('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAction === 'all'
                  ? 'bg-[#117181] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({auditLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction('create')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAction === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catat Baru ({stats.created})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction('update')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAction === 'update'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Koreksi / Edit ({stats.updated})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction('delete')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAction === 'delete'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hapus ({stats.deleted})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAction('auth')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedAction === 'auth'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Otorisasi User ({stats.userAuth})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari keterangan, nominal, invoice, petugas..."
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#117181] focus:bg-[#FFFDFA] transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Secondary Filter Row: Actor & Date */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            {/* Actor dropdown */}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Petugas:</span>
              <select
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#117181]"
              >
                <option value="all">Semua Petugas ({uniqueActors.length})</option>
                {uniqueActors.map((actor) => (
                  <option key={actor.uid} value={actor.uid}>
                    {actor.name} ({actor.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date range dropdown */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Waktu:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#117181]"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini Saja</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Menampilkan <strong>{filteredLogs.length}</strong> dari {auditLogs.length} aktivitas
          </div>
        </div>
      </div>

      {/* 4. Embedded Main Audit Log Feed / List as Timeline */}
      <div className="p-3.5 sm:p-5 bg-[#FFFDFA]">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Tidak ada riwayat aktivitas yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Silakan atur kembali kata kunci pencarian atau opsi filter tanggal/aksi di atas.
            </p>
          </div>
        ) : (
          <div className="relative pl-0.5 sm:pl-1">
            {filteredLogs.map((log, index) => {
              const badge = getActionBadge(log.action);
              const BadgeIcon = badge.icon;
              const isSuper = log.actorRole === 'superadmin';
              const isExpanded = expandedLogId === log.id;
              const hasDiff = Boolean(log.details?.changes && log.details.changes.length > 0);
              const isLast = index === filteredLogs.length - 1;

              return (
                <div key={log.id} className="relative flex items-start gap-2.5 sm:gap-3.5 pb-3.5 sm:pb-4 group last:pb-0.5">
                  {/* Vertical connecting line between timeline nodes */}
                  {!isLast && (
                    <span
                      className="absolute left-[15px] top-[30px] bottom-0 w-[1.5px] bg-slate-200"
                      aria-hidden="true"
                    />
                  )}

                  {/* Timeline Dot Node (Compact and distinct circle with icon) */}
                  <div className="relative z-10 flex flex-col items-center shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full border-2 ${badge.nodeBorder} ${badge.nodeBg} flex items-center justify-center shadow-xs transition-transform group-hover:scale-105`}
                      title={log.actionLabel}
                    >
                      <BadgeIcon className={`w-3.5 h-3.5 ${badge.nodeText}`} />
                    </div>
                  </div>

                  {/* Timeline Card Content (Tighter padding & spacing) */}
                  <div className="flex-1 min-w-0 bg-[#FFFDFA] hover:bg-slate-50/70 rounded-xl border border-slate-200 hover:border-slate-300 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs hover:shadow-xs transition-all space-y-1.5">
                    {/* Top Metadata Row: Action Badge, Timestamp, Relative Time */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[11px] font-bold border ${badge.colorClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          <span>{log.actionLabel}</span>
                        </span>

                        {/* Actor Badge */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                          <span className="text-slate-400 font-normal">oleh</span>
                          <strong className="text-slate-900">{log.actorName}</strong>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                              isSuper
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-teal-100 text-[#0c4f5b] border border-teal-200'
                            }`}
                          >
                            {isSuper ? 'Superadmin' : 'Admin'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-600">{getRelativeTime(log.timestamp)}</span>
                        <span>•</span>
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div className="text-xs font-semibold text-slate-800 leading-snug">
                      {log.summary}
                    </div>

                    {/* Context Details Strip (nominal, method, invoice, category) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                      {log.details?.amount !== undefined && (
                        <span
                          className={`font-black px-2 py-0.5 rounded-md border text-[11px] ${
                            log.details.transactionType === 'income'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {formatRupiah(log.details.amount)}
                        </span>
                      )}

                      {log.details?.categoryName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]">
                          {log.details.categoryName}
                        </span>
                      )}

                      {log.details?.paymentMethod && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#0c4f5b] border border-[#b5e1e7] font-medium text-[11px]">
                          {log.details.paymentMethod}
                        </span>
                      )}

                      {log.details?.referenceNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">
                          Ref: {log.details.referenceNumber}
                        </span>
                      )}

                      {/* Diff toggle button if there are field-level modifications */}
                      {hasDiff && (
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#117181] hover:underline cursor-pointer"
                        >
                          <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Rincian Koreksi'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Expanded Field Diff Card */}
                    {isExpanded && log.details?.changes && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Rincian Kolom yang Diubah:</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {log.details.changes.map((ch, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-md border border-slate-200 shadow-2xs space-y-0.5"
                            >
                              <span className="font-bold text-slate-700 block text-[11px]">{ch.fieldLabel}</span>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 line-through">
                                  {String(ch.oldValue || '-')}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold">
                                  {String(ch.newValue || '-')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
