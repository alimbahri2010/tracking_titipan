import React, { useState, useEffect } from 'react';
import { X, Check, ArrowUpRight, ArrowDownRight, Tag, Calendar, FileText, CreditCard } from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { Transaction, TransactionType } from '../types';
import {
  PAYMENT_METHODS,
  formatRupiah,
  getTodayDateString,
  parseNumberId,
} from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editData,
  defaultType = 'income',
}) => {
  const { categories, addTransaction, updateTransaction } = useCashflow();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [rawAmount, setRawAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Kas Tunai (Cash)');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Reset or populate form when opening
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setRawAmount(String(editData.amount));
      setCategoryId(editData.categoryId);
      setDate(editData.date || getTodayDateString());
      setDescription(editData.description || '');
      setPaymentMethod(editData.paymentMethod || 'Kas Tunai (Cash)');
      setReferenceNumber(editData.referenceNumber || '');
    } else {
      setType(defaultType);
      setRawAmount('');
      setDate(getTodayDateString());
      setDescription('');
      setPaymentMethod('Kas Tunai (Cash)');
      setReferenceNumber('');
      // Set first matching category
      const firstCat = categories.find((c) => c.type === defaultType && c.isActive !== false);
      if (firstCat) setCategoryId(firstCat.id);
    }
    setErrorMsg('');
  }, [editData, defaultType, isOpen, categories]);

  // Adjust category if type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstCat = categories.find((c) => c.type === newType && c.isActive !== false);
    if (firstCat) {
      setCategoryId(firstCat.id);
    } else {
      setCategoryId('');
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseNumberId(rawAmount);
    setRawAmount(String(current + addValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseNumberId(rawAmount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari 0.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Pilih kategori transaksi terlebih dahulu.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : 'Umum';
    const categoryGroup = selectedCategory?.group || '';
    const categoryColor = selectedCategory ? selectedCategory.color : '#0e6e7d';

    setIsSubmitting(true);
    try {
      if (editData) {
        await updateTransaction(editData.id, {
          type,
          amount: numericAmount,
          categoryId,
          categoryName,
          categoryGroup,
          categoryColor,
          date,
          description: description.trim(),
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
        });
      } else {
        await addTransaction({
          type,
          amount: numericAmount,
          categoryId,
          categoryName,
          categoryGroup,
          categoryColor,
          date,
          description: description.trim(),
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setErrorMsg(err.message || 'Gagal menyimpan transaksi. Pastikan terhubung internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const relevantCategories = categories.filter((c) => c.type === type && c.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFDFA] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Type selector */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FFFDFA]">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editData ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              {editData
                ? 'Perbarui rincian arus kas Titipan'
                : 'Pencatatan harian pemasukan atau pengeluaran operasional'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Type Toggle: Pemasukan / Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Arus Kas
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-extrabold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-50/60'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pemasukan (+)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-extrabold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-800 hover:bg-rose-50/60'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          {/* Nominal (Amount) Input with Quick Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                required
                value={rawAmount ? formatRupiah(parseNumberId(rawAmount)).replace('Rp', '').trim() : ''}
                onChange={(e) => setRawAmount(e.target.value)}
                placeholder="0"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-lg font-black tracking-tight border focus:outline-none focus:ring-2 transition-all ${
                  type === 'income'
                    ? 'border-emerald-300 focus:ring-emerald-500 text-emerald-700'
                    : 'border-rose-300 focus:ring-rose-500 text-rose-700'
                }`}
              />
            </div>

            {/* Quick nominal buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 100000, 500000, 1000000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-colors"
                >
                  +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000} Rb`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRawAmount('')}
                className="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px] font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tanggal & Kategori Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategori</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                <option value="" disabled>
                  -- Pilih Kategori --
                </option>
                {Object.entries(
                  relevantCategories.reduce((acc, cat) => {
                    const g = cat.group || 'Lain-lain';
                    if (!acc[g]) acc[g] = [];
                    acc[g].push(cat);
                    return acc;
                  }, {} as Record<string, typeof relevantCategories>)
                ).map(([groupTitle, cats]) => (
                  <optgroup key={groupTitle} label={`📁 ${groupTitle}`}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Keterangan / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Keterangan Transaksi</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Ongkir armada Truk Titipan B 9876 XYZ rute Jakarta-Surabaya, uang jalan supir..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white resize-none"
            />
          </div>

          {/* Metode Pembayaran & No. Bukti / Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Metode Pembayaran</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. Bukti / Resi / Invoice
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="INV-2026/09/001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editData ? 'Perbarui Transaksi' : 'Simpan Transaksi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
