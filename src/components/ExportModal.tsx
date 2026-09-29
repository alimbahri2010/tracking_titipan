import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { useAuth } from '../context/AuthContext';
import { exportTransactionsToPdf } from '../utils/exportPdf';
import { exportTransactionsToExcel } from '../utils/exportExcel';
import { MONTH_NAMES_ID } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, filteredTransactions, summary, filters } = useCashflow();
  const { currentUser, userProfile, activeRole } = useAuth();

  const [scope, setScope] = useState<'filtered' | 'all' | 'specific_month'>('filtered');
  const [format, setFormat] = useState<'both' | 'pdf' | 'excel'>('pdf');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Resolve which transactions to export
  const getExportData = () => {
    if (scope === 'filtered') {
      return {
        data: filteredTransactions,
        label: `Tersaring (${filteredTransactions.length} Transaksi)`,
      };
    }
    if (scope === 'specific_month') {
      const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
      const monthTx = transactions.filter((tx) => tx.date && tx.date.startsWith(monthPrefix));
      return {
        data: monthTx,
        label: `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`,
      };
    }
    return {
      data: transactions,
      label: `Semua Periode (${transactions.length} Transaksi)`,
    };
  };

  const handleExport = async () => {
    const { data, label } = getExportData();
    if (data.length === 0) {
      alert('Tidak ada transaksi untuk diekspor pada pilihan ini.');
      return;
    }

    setIsExporting(true);
    const userName = userProfile?.displayName || currentUser?.displayName || 'Petugas Titipan';
    const roleLabel = activeRole === 'superadmin' ? 'Super Admin' : 'Admin';

    // Compute custom summary for exported subset
    let totalInc = 0;
    let totalExp = 0;
    data.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') totalInc += amt;
      if (tx.type === 'expense') totalExp += amt;
    });

    const exportSummary = {
      ...summary,
      totalIncome: totalInc,
      totalExpense: totalExp,
      netCashflow: totalInc - totalExp,
    };

    try {
      if (format === 'pdf' || format === 'both') {
        exportTransactionsToPdf({
          transactions: data,
          summary: exportSummary,
          filterLabel: label,
          userName,
          userRole: roleLabel,
        });
      }

      if (format === 'excel' || format === 'both') {
        exportTransactionsToExcel({
          transactions: data,
          summary: exportSummary,
          filterLabel: label,
          userName,
        });
      }

      onClose();
    } catch (err) {
      console.error('Export error:', err);
      alert('Terjadi kesalahan saat mengekspor laporan.');
    } finally {
      setIsExporting(false);
    }
  };

  const { data: currentSelectedData, label: currentSelectedLabel } = getExportData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-700" />
              <span>Ekspor Laporan Cashflow</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download rekapitulasi keuangan Titipan Moving & Storage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Format selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Format Dokumen
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  format === 'pdf'
                    ? 'border-rose-500 bg-rose-50/60 text-rose-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-6 h-6 text-rose-600" />
                <span className="text-xs font-bold">PDF Resmi</span>
                <span className="text-[10px] text-slate-400">Siap Cetak & Ttd</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-bold">Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400">Multi-Sheet Data</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('both')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  format === 'both'
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center -space-x-1">
                  <FileText className="w-5 h-5 text-rose-600" />
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold">Keduanya</span>
                <span className="text-[10px] text-slate-400">PDF + Excel</span>
              </button>
            </div>
          </div>

          {/* Scope selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cakupan Data
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  className="text-teal-700 focus:ring-teal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Sesuai Filter Aktif</span>
                  <p className="text-slate-500">
                    Mengekspor {filteredTransactions.length} transaksi yang sedang tampil di layar
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'specific_month'}
                  onChange={() => setScope('specific_month')}
                  className="text-teal-700 focus:ring-teal-600"
                />
                <div className="text-xs flex-1">
                  <span className="font-bold text-slate-800">Pilih Bulan Spesifik</span>
                  <p className="text-slate-500">Laporan bulanan lengkap untuk periode tertentu</p>
                </div>
              </label>

              {scope === 'specific_month' && (
                <div className="flex items-center gap-2 pl-7 pt-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {MONTH_NAMES_ID.map((name, idx) => (
                      <option key={idx} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {[2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="text-teal-700 focus:ring-teal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Semua Data (Keseluruhan)</span>
                  <p className="text-slate-500">
                    Seluruh arsip arus kas Titipan ({transactions.length} transaksi)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Preview Box */}
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs text-teal-900">
            <span>Siap diekspor:</span>
            <strong className="font-black">{currentSelectedData.length} Catatan Transaksi</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isExporting || currentSelectedData.length === 0}
            onClick={handleExport}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Mengekspor...' : 'Unduh Laporan Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
