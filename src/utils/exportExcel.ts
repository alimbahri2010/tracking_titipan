import * as XLSX from 'xlsx';
import { Transaction, CashflowSummary } from '../types';
import { formatIndoDate, formatRupiah } from './formatters';

interface ExportExcelOptions {
  transactions: Transaction[];
  summary: CashflowSummary;
  filterLabel?: string;
  userName?: string;
}

export function exportTransactionsToExcel({
  transactions,
  summary,
  filterLabel = 'Semua Periode',
  userName = 'Admin Titipan',
}: ExportExcelOptions) {
  const wb = XLSX.utils.book_new();

  // 1. Transactions Sheet
  const txData = transactions.map((tx, idx) => ({
    'No': idx + 1,
    'Tanggal': tx.date,
    'Tipe': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Kategori': tx.categoryName,
    'Nominal (Rp)': tx.amount,
    'Keterangan': tx.description || '-',
    'Metode Pembayaran': tx.paymentMethod || 'Kas Tunai',
    'No. Bukti / Invoice': tx.referenceNumber || '-',
    'Dicatat Oleh': tx.createdByName || 'Admin',
    'Email Pencatat': tx.createdByEmail || '-',
    'Waktu Catat': tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '-',
  }));

  const wsTransactions = XLSX.utils.json_to_sheet(txData);

  // Set column widths for readability
  wsTransactions['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Tipe
    { wch: 28 }, // Kategori
    { wch: 18 }, // Nominal
    { wch: 35 }, // Keterangan
    { wch: 22 }, // Metode
    { wch: 20 }, // No. Bukti
    { wch: 20 }, // Pencatat
    { wch: 26 }, // Email
    { wch: 22 }, // Waktu Catat
  ];

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  // 2. Summary Sheet
  const summaryRows = [
    { 'Parameter Finansial': 'PERUSAHAAN', 'Nilai': 'TITIPAN (TIBA-TIBA PINDAHAN - MOVING & STORAGE)' },
    { 'Parameter Finansial': 'Periode Laporan', 'Nilai': filterLabel },
    { 'Parameter Finansial': 'Tanggal Ekspor', 'Nilai': new Date().toLocaleString('id-ID') },
    { 'Parameter Finansial': 'Diekspor Oleh', 'Nilai': userName },
    { 'Parameter Finansial': '-------------------------', 'Nilai': '-------------------------' },
    { 'Parameter Finansial': 'Total Pemasukan (IDR)', 'Nilai': summary.totalIncome },
    { 'Parameter Finansial': 'Total Pengeluaran (IDR)', 'Nilai': summary.totalExpense },
    { 'Parameter Finansial': 'Saldo Kas Bersih (IDR)', 'Nilai': summary.netCashflow },
    { 'Parameter Finansial': 'Status Kas', 'Nilai': summary.netCashflow >= 0 ? 'SURPLUS' : 'DEFISIT' },
    { 'Parameter Finansial': 'Total Transaksi Tercatat', 'Nilai': transactions.length },
    { 'Parameter Finansial': 'Pemasukan Hari Ini', 'Nilai': summary.todayIncome },
    { 'Parameter Finansial': 'Pengeluaran Hari Ini', 'Nilai': summary.todayExpense },
    { 'Parameter Finansial': 'Pemasukan Bulan Ini', 'Nilai': summary.thisMonthIncome },
    { 'Parameter Finansial': 'Pengeluaran Bulan Ini', 'Nilai': summary.thisMonthExpense },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kas');

  // 3. Category Breakdown Sheet
  const catMap: { [catName: string]: { type: string; total: number; count: number } } = {};
  transactions.forEach((tx) => {
    const key = tx.categoryName || 'Lain-lain';
    if (!catMap[key]) {
      catMap[key] = { type: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', total: 0, count: 0 };
    }
    catMap[key].total += Number(tx.amount) || 0;
    catMap[key].count += 1;
  });

  const catRows = Object.entries(catMap).map(([catName, data]) => ({
    'Kategori': catName,
    'Tipe': data.type,
    'Total Nominal (Rp)': data.total,
    'Jumlah Transaksi': data.count,
    'Rata-rata per Transaksi': data.count > 0 ? Math.round(data.total / data.count) : 0,
  }));

  const wsCategories = XLSX.utils.json_to_sheet(catRows);
  wsCategories['!cols'] = [
    { wch: 30 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Per Kategori');

  // Generate file and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Cashflow_Titipan_${dateStr}.xlsx`);
}
