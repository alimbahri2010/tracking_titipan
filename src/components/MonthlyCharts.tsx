import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import {
  MONTH_NAMES_ID,
  MONTH_SHORT_ID,
  formatRupiah,
  formatNumberId,
} from '../utils/formatters';

interface MonthlyChartsProps {
  onExport: () => void;
}

export const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ onExport }) => {
  const { transactions } = useCashflow();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11

  // Extract all available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = parseInt(tx.date.substring(0, 4), 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentDate]);

  // Aggregate monthly data for the selected year (all 12 months)
  const yearlyMonthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_SHORT_ID[i],
      income: 0,
      expense: 0,
      net: 0,
    }));

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const [yStr, mStr] = tx.date.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;

      if (y === selectedYear && m >= 0 && m < 12) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
          data[m].income += amt;
        } else if (tx.type === 'expense') {
          data[m].expense += amt;
        }
        data[m].net = data[m].income - data[m].expense;
      }
    });

    return data;
  }, [transactions, selectedYear]);

  // Find max value for scaling the bar chart
  const maxMonthlyVal = useMemo(() => {
    let max = 1;
    yearlyMonthlyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [yearlyMonthlyData]);

  // Daily data for selected month
  const selectedMonthDailyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyMap: { [day: number]: { income: number; expense: number } } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap[i] = { income: 0, expense: 0 };
    }

    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(monthPrefix)) {
        const day = parseInt(tx.date.substring(8, 10), 10);
        const amt = Number(tx.amount) || 0;
        if (dailyMap[day]) {
          if (tx.type === 'income') dailyMap[day].income += amt;
          if (tx.type === 'expense') dailyMap[day].expense += amt;
        }
      }
    });

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: dailyMap[i + 1].income,
      expense: dailyMap[i + 1].expense,
      net: dailyMap[i + 1].income - dailyMap[i + 1].expense,
    }));
  }, [transactions, selectedYear, selectedMonth]);

  // Max daily value for scaling daily chart
  const maxDailyVal = useMemo(() => {
    let max = 1;
    selectedMonthDailyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [selectedMonthDailyData]);

  // Category breakdown for selected month
  const categoryStats = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    const incomeCats: { [name: string]: { total: number; color?: string } } = {};
    const expenseCats: { [name: string]: { total: number; color?: string } } = {};

    let totalInc = 0;
    let totalExp = 0;

    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(monthPrefix)) {
        const amt = Number(tx.amount) || 0;
        const catName = tx.categoryName || 'Lain-lain';

        if (tx.type === 'income') {
          totalInc += amt;
          if (!incomeCats[catName]) incomeCats[catName] = { total: 0, color: tx.categoryColor };
          incomeCats[catName].total += amt;
        } else if (tx.type === 'expense') {
          totalExp += amt;
          if (!expenseCats[catName]) expenseCats[catName] = { total: 0, color: tx.categoryColor };
          expenseCats[catName].total += amt;
        }
      }
    });

    const expenseList = Object.entries(expenseCats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        percentage: totalExp > 0 ? (data.total / totalExp) * 100 : 0,
        color: data.color || '#ef4444',
      }))
      .sort((a, b) => b.total - a.total);

    const incomeList = Object.entries(incomeCats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        percentage: totalInc > 0 ? (data.total / totalInc) * 100 : 0,
        color: data.color || '#0e6e7d',
      }))
      .sort((a, b) => b.total - a.total);

    return {
      incomeList,
      expenseList,
      totalIncome: totalInc,
      totalExpense: totalExp,
      netCashflow: totalInc - totalExp,
    };
  }, [transactions, selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* 1. Month & Year Navigation Control Banner */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#FFFDFA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <Calendar className="w-4 h-4 text-[#117181]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
              Laporan & Grafik Arus Kas Bulanan
            </h2>
            <p className="text-[11px] text-slate-500">
              Visualisasi tren pemasukan, pengeluaran, dan profitabilitas Titipan
            </p>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs sm:text-sm font-extrabold text-slate-800 min-w-[110px] text-center">
              {MONTH_NAMES_ID[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#117181]"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>

          {/* Export CTA */}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#117181] hover:bg-[#0c4f5b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ekspor PDF/Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Selected Month Summary KPI Strip */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1 */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Pemasukan ({MONTH_NAMES_ID[selectedMonth]})</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
            {formatRupiah(categoryStats.totalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total penerimaan operasional bulan ini
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Pengeluaran ({MONTH_NAMES_ID[selectedMonth]})</span>
            <span className="p-1 rounded bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">
            {formatRupiah(categoryStats.totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total biaya &amp; beban operasional armada
          </div>
        </div>

        {/* KPI 3 */}
        <div
          className={`rounded-xl p-3 border shadow-2xs ${
            categoryStats.netCashflow >= 0
              ? 'bg-[#f0f8f9] border-[#b5e1e7] text-[#0c4f5b]'
              : 'bg-rose-50/50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase">
            <span>Kas Bersih (Net Margin)</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                categoryStats.netCashflow >= 0
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {categoryStats.netCashflow >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <div
            className={`text-lg sm:text-xl font-black mt-1 ${
              categoryStats.netCashflow >= 0 ? 'text-[#0c4f5b]' : 'text-rose-700'
            }`}
          >
            {formatRupiah(categoryStats.netCashflow)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Margin:{' '}
            {categoryStats.totalIncome > 0
              ? `${Math.round(
                  (categoryStats.netCashflow / categoryStats.totalIncome) * 100
                )}% dari pemasukan`
              : '0%'}
          </div>
        </div>
      </div>

      {/* 3. Bar Chart: 12-Month Yearly Overview */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Komparasi Pemasukan vs Pengeluaran (Tahun {selectedYear})</span>
            </h3>
            <p className="text-[11px] text-slate-500">Perbandingan arus kas bulanan sepanjang tahun (klik bulan untuk memilih)</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
              <span>Pemasukan</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
              <span>Pengeluaran</span>
            </span>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-56 sm:h-64 w-full pt-3 flex items-end justify-between gap-1 sm:gap-2.5 border-b border-slate-200">
          {yearlyMonthlyData.map((d) => {
            const isSelected = d.monthIndex === selectedMonth;
            const incHeight = maxMonthlyVal > 0 ? (d.income / maxMonthlyVal) * 100 : 0;
            const expHeight = maxMonthlyVal > 0 ? (d.expense / maxMonthlyVal) * 100 : 0;

            return (
              <div
                key={d.monthIndex}
                onClick={() => setSelectedMonth(d.monthIndex)}
                className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer rounded-t-lg p-0.5 sm:p-1 transition-all ${
                  isSelected ? 'bg-teal-50/80 ring-1 ring-teal-400' : 'hover:bg-slate-50'
                }`}
                title={`${d.monthName}: Masuk ${formatRupiah(d.income)} | Keluar ${formatRupiah(
                  d.expense
                )}`}
              >
                {/* Bars Container */}
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-40 sm:h-48">
                  {/* Income bar */}
                  <div
                    style={{ height: `${Math.max(incHeight, 2)}%` }}
                    className={`w-1/2 rounded-t-xs sm:rounded-t-sm transition-all ${
                      d.income > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-100'
                    }`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${Math.max(expHeight, 2)}%` }}
                    className={`w-1/2 rounded-t-xs sm:rounded-t-sm transition-all ${
                      d.expense > 0 ? 'bg-rose-500 group-hover:bg-rose-600' : 'bg-slate-100'
                    }`}
                  />
                </div>

                {/* Month label */}
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-1.5 ${
                    isSelected ? 'text-teal-900 font-black underline' : 'text-slate-500'
                  }`}
                >
                  {d.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Daily Trend in Selected Month */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#117181]" />
              <span>
                Aktivitas Harian: {MONTH_NAMES_ID[selectedMonth]} {selectedYear}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribusi arus kas tanggal 1 sampai akhir bulan
            </p>
          </div>
        </div>

        {/* Daily chart bars */}
        <div className="h-40 sm:h-48 w-full pt-3 flex items-end justify-between gap-1 overflow-x-auto border-b border-slate-200">
          {selectedMonthDailyData.map((day) => {
            const incH = maxDailyVal > 0 ? (day.income / maxDailyVal) * 100 : 0;
            const expH = maxDailyVal > 0 ? (day.expense / maxDailyVal) * 100 : 0;

            return (
              <div
                key={day.day}
                className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group hover:bg-slate-50 p-0.5 rounded cursor-default"
                title={`Tgl ${day.day}: Masuk ${formatRupiah(day.income)}, Keluar ${formatRupiah(
                  day.expense
                )}`}
              >
                <div className="w-full flex items-end justify-center gap-0.5 h-28 sm:h-36">
                  <div
                    style={{ height: `${Math.max(incH, 1)}%` }}
                    className={`w-1/2 rounded-t-xs ${
                      day.income > 0 ? 'bg-emerald-500' : 'bg-slate-100'
                    }`}
                  />
                  <div
                    style={{ height: `${Math.max(expH, 1)}%` }}
                    className={`w-1/2 rounded-t-xs ${
                      day.expense > 0 ? 'bg-rose-500' : 'bg-slate-100'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-semibold text-slate-400 mt-1">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Category Breakdown Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 bg-[#FFFDFA]">
        {/* Expense Categories Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Rincian Pengeluaran per Kategori</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Total: {formatRupiah(categoryStats.totalExpense)}
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
              {categoryStats.expenseList.length} Kategori
            </span>
          </div>

          {categoryStats.expenseList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada pengeluaran pada bulan ini.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {categoryStats.expenseList.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">
                        {cat.percentage.toFixed(1)}%
                      </span>
                      <span className="font-bold text-slate-900">{formatRupiah(cat.total)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || '#ef4444',
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income Categories Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Rincian Pemasukan per Kategori</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Total: {formatRupiah(categoryStats.totalIncome)}
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
              {categoryStats.incomeList.length} Kategori
            </span>
          </div>

          {categoryStats.incomeList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada pemasukan pada bulan ini.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {categoryStats.incomeList.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">
                        {cat.percentage.toFixed(1)}%
                      </span>
                      <span className="font-bold text-slate-900">{formatRupiah(cat.total)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || '#0e6e7d',
                      }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
