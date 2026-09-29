import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  User,
  Clock,
  Inbox,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { formatIndoDate, formatRupiah } from '../utils/formatters';
import { TransactionFilter } from './TransactionFilter';

interface TransactionListProps {
  onEdit: (tx: Transaction) => void;
  onOpenNew: (type?: 'income' | 'expense') => void;
  onExport?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onEdit, onOpenNew, onExport }) => {
  const { filteredTransactions, deleteTransaction, loading, filters } = useCashflow();
  const { currentUser, isSuperAdmin } = useAuth();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedList = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Gagal menghapus transaksi. Periksa hak akses.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canModify = (tx: Transaction) => {
    if (isSuperAdmin) return true;
    if (currentUser && tx.createdByUid === currentUser.uid) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-2xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-600 border-t-transparent mb-3"></div>
        <p className="text-slate-500 font-medium text-sm">Menyinkronkan data arus kas Titipan...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* 1. Action Strip / Summary Header (Merged into single card) */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#FFFDFA]">
        {/* Left: Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNew('expense')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenNew('income')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Pemasukan</span>
          </button>
        </div>

        {/* Right: Export Button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Ekspor PDF / Excel</span>
          </button>
        )}
      </div>

      {/* 2. Filter Toolbar (Embedded directly inside this same card) */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 bg-[#FFFDFA] border-b border-slate-100">
        <TransactionFilter embedded />
      </div>

      {/* 3. Table or Empty State Content */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Transaksi Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Tidak ada data arus kas yang cocok dengan kriteria filter saat ini, atau belum ada transaksi yang dicatat.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenNew('income')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              + Catat Pemasukan
            </button>
            <button
              type="button"
              onClick={() => onOpenNew('expense')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              - Catat Pengeluaran
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Tipe</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4">Metode</th>
              <th className="py-3 px-4">Pencatat</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedList.map((tx) => {
              const isIncome = tx.type === 'income';
              const userAllowed = canModify(tx);

              return (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Tanggal */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold text-xs">
                    {formatIndoDate(tx.date)}
                  </td>

                  {/* Tipe */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{isIncome ? 'Masuk' : 'Keluar'}</span>
                    </span>
                  </td>

                  {/* Kategori */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <span
                        className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md text-slate-700 bg-slate-100"
                        style={
                          tx.categoryColor
                            ? { borderLeft: `3px solid ${tx.categoryColor}` }
                            : undefined
                        }
                      >
                        {tx.categoryName}
                      </span>
                      {tx.categoryGroup && (
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          {tx.categoryGroup}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Keterangan & Reference */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-slate-800 text-xs font-medium truncate" title={tx.description}>
                      {tx.description || '-'}
                    </div>
                    {tx.referenceNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref: {tx.referenceNumber}
                      </span>
                    )}
                  </td>

                  {/* Metode */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tx.paymentMethod || 'Kas Tunai'}</span>
                    </span>
                  </td>

                  {/* Pencatat */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[100px]">{tx.createdByName || 'Admin'}</span>
                    </span>
                  </td>

                  {/* Nominal */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-black text-sm">
                    <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                      {isIncome ? '+ ' : '- '}
                      {formatRupiah(tx.amount)}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      {userAllowed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            title="Edit Transaksi"
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(tx.id)}
                            title="Hapus Transaksi"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Read-only</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {paginatedList.map((tx) => {
          const isIncome = tx.type === 'income';
          const userAllowed = canModify(tx);

          return (
            <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{formatIndoDate(tx.date)}</span>
                <span className={`text-base font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isIncome ? '+ ' : '- '}
                  {formatRupiah(tx.amount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isIncome
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {tx.categoryName}
                </span>
                {tx.categoryGroup && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({tx.categoryGroup})
                  </span>
                )}
              </div>

              {tx.description && <p className="text-xs text-slate-700 font-medium">{tx.description}</p>}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <span>{tx.paymentMethod || 'Kas Tunai'}</span>
                <div className="flex items-center gap-2">
                  <span>Oleh: {tx.createdByName || 'Admin'}</span>
                  {userAllowed && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() => onEdit(tx)}
                        className="p-1 text-slate-400 hover:text-teal-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(tx.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-[#FFFDFA] border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan halaman <strong className="text-slate-800">{currentPage}</strong> dari{' '}
            <strong className="text-slate-800">{totalPages}</strong> ({filteredTransactions.length} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-[#FFFDFA] hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-[#FFFDFA] hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Transaksi</h4>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo kas akan otomatis disesuaikan secara real-time.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
