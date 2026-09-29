import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { formatRupiah } from '../utils/formatters';

interface StatCardsProps {
  onExport?: () => void;
  onOpenNewTransaction?: (type?: 'income' | 'expense') => void;
}

export const StatCards: React.FC<StatCardsProps> = () => {
  const { summary, filteredTransactions, filters } = useCashflow();

  // Compute stats for current active filter view
  let filteredIncome = 0;
  let filteredExpense = 0;
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'income') filteredIncome += Number(tx.amount) || 0;
    if (tx.type === 'expense') filteredExpense += Number(tx.amount) || 0;
  });
  const filteredNet = filteredIncome - filteredExpense;

  const isFiltering =
    filters.search ||
    filters.type !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.datePreset !== 'this_month' ||
    filters.paymentMethod !== 'all';

  return (
    <div className="space-y-3">
      {/* Top Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Card 1: Saldo Kas Bersih (Total Balance) */}
        <div className="bg-gradient-to-br from-[#117181] via-[#0c4f5b] to-[#05262c] text-white rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#117181]/50 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <span className="text-teal-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Saldo Kas Saat Ini</span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                summary.netCashflow >= 0
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {summary.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {formatRupiah(summary.netCashflow)}
            </div>
            <div className="text-[11px] text-teal-300/80 mt-0.5 flex items-center gap-1">
              <span>Bulan ini:</span>
              <span className="font-semibold text-white">
                {summary.thisMonthNet >= 0 ? '+' : ''}
                {formatRupiah(summary.thisMonthNet)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-teal-700/60 flex items-center justify-between text-[11px] text-teal-200">
            <span>Hari ini:</span>
            <span className="font-bold text-white">
              {summary.todayNet >= 0 ? '+' : ''}
              {formatRupiah(summary.todayNet)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Pemasukan */}
        <div className="bg-[#FFFDFA] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <span>Pemasukan {isFiltering ? '(Tersaring)' : '(Bulan Ini)'}</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>Inflow</span>
            </span>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
              {formatRupiah(isFiltering ? filteredIncome : summary.thisMonthIncome)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Hari ini: <strong className="text-slate-700">{formatRupiah(summary.todayIncome)}</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Semua Pemasukan:</span>
            <span className="font-bold text-slate-800">{formatRupiah(summary.totalIncome)}</span>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="bg-[#FFFDFA] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-rose-50 text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" />
              </span>
              <span>Pengeluaran {isFiltering ? '(Tersaring)' : '(Bulan Ini)'}</span>
            </span>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <ArrowDownRight className="w-3 h-3" />
              <span>Outflow</span>
            </span>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {formatRupiah(isFiltering ? filteredExpense : summary.thisMonthExpense)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Hari ini: <strong className="text-slate-700">{formatRupiah(summary.todayExpense)}</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Semua Pengeluaran:</span>
            <span className="font-bold text-slate-800">{formatRupiah(summary.totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
