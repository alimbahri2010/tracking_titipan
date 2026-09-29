import React from 'react';
import { Search, Filter, RotateCcw, Calendar, CreditCard, ChevronDown } from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { DateFilterPreset } from '../types';
import { PAYMENT_METHODS } from '../utils/formatters';

interface TransactionFilterProps {
  className?: string;
  embedded?: boolean;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  className = '',
  embedded = false,
}) => {
  const { filters, setFilters, resetFilters, categories } = useCashflow();

  const handleDatePresetChange = (preset: DateFilterPreset) => {
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
    }));
  };

  const activeCategories = categories.filter((c) => c.isActive !== false);

  const containerClasses = embedded
    ? `space-y-2.5 ${className}`
    : `bg-[#FFFDFA] rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3.5 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Search and Main Type Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Cari transaksi, keterangan, no. invoice, atau pencatat..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#117181] focus:bg-[#FFFDFA] transition-all text-slate-800 placeholder-slate-400"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'all'
                ? 'bg-[#FFFDFA] text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'income' }))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            + Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'expense' }))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            - Pengeluaran
          </button>
        </div>
      </div>

      {/* Unified Filter Controls Row: Periode + Kategori + Metode + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 text-xs pt-0.5">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
          {/* Date Presets */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>Periode:</span>
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'today' as DateFilterPreset, label: 'Hari Ini' },
                { id: 'this_week' as DateFilterPreset, label: 'Minggu Ini' },
                { id: 'this_month' as DateFilterPreset, label: 'Bulan Ini' },
                { id: 'custom' as DateFilterPreset, label: 'Rentang Kustom' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDatePresetChange(item.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer text-xs ${
                    filters.datePreset === item.id
                      ? 'bg-[#117181] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block h-4 w-px bg-slate-200" />

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-semibold">Kategori:</span>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-[#117181]"
            >
              <option value="all">Semua Kategori</option>
              {activeCategories
                .filter((c) => (filters.type === 'all' ? true : c.type === filters.type))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'income' ? '🟢' : '🔴'} {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-semibold">Metode:</span>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-[#117181]"
            >
              <option value="all">Semua Metode</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        <button
          type="button"
          onClick={resetFilters}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-semibold text-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>

      {/* Custom Date Inputs if 'custom' is active */}
      {filters.datePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-2.5 bg-[#f0f8f9] rounded-xl border border-[#b5e1e7] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0c4f5b]">Dari:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1 bg-[#FFFDFA] border border-[#b5e1e7] rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#117181] text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0c4f5b]">Sampai:</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1 bg-[#FFFDFA] border border-[#b5e1e7] rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#117181] text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
