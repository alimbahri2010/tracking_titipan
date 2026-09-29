import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, CashflowSummary } from '../types';
import { formatIndoDate, formatRupiah } from './formatters';

interface ExportPdfOptions {
  transactions: Transaction[];
  summary: CashflowSummary;
  filterLabel?: string;
  userName?: string;
  userRole?: string;
}

export function exportTransactionsToPdf({
  transactions,
  summary,
  filterLabel = 'Semua Periode',
  userName = 'Admin Titipan',
  userRole = 'Admin',
}: ExportPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner Background (Titipan Brand Teal)
  doc.setFillColor(14, 110, 125); // #0e6e7d
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Amber accent line
  doc.setFillColor(245, 158, 11); // #f59e0b
  doc.rect(0, 36, pageWidth, 2, 'F');

  // Brand Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TITIPAN® CASHFLOW', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 245, 247);
  doc.text('TIBA-TIBA PINDAHAN | MOVING & STORAGE', 14, 22);
  doc.text('Laporan Arus Kas Harian & Operasional Perusahaan', 14, 28);

  // Print Date & Issuer on the right
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Tanggal Cetak: ${printDateStr}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Dicetak Oleh: ${userName} (${userRole})`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Periode: ${filterLabel}`, pageWidth - 14, 28, { align: 'right' });

  // Summary Cards Box
  const startY = 44;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, startY, pageWidth - 28, 24, 2, 2, 'FD');

  // Income Card
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('TOTAL PEMASUKAN', 20, startY + 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatRupiah(summary.totalIncome), 20, startY + 18);

  // Expense Card
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL PENGELUARAN', 85, startY + 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // red-500
  doc.text(formatRupiah(summary.totalExpense), 85, startY + 18);

  // Net Cashflow Card
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('SALDO KAS BERSIH', 150, startY + 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const netColor = summary.netCashflow >= 0 ? [14, 110, 125] : [220, 38, 38];
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(formatRupiah(summary.netCashflow), 150, startY + 18);

  // Transactions Table
  const tableData = transactions.map((tx, idx) => [
    idx + 1,
    formatIndoDate(tx.date),
    tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    tx.categoryName,
    tx.description || '-',
    tx.paymentMethod || 'Kas Tunai',
    tx.createdByName || 'Admin',
    (tx.type === 'income' ? '+ ' : '- ') + formatRupiah(tx.amount),
  ]);

  autoTable(doc, {
    startY: startY + 30,
    head: [
      [
        'No',
        'Tanggal',
        'Tipe',
        'Kategori',
        'Keterangan',
        'Metode',
        'Pencatat',
        'Nominal (Rp)',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [14, 110, 125], // Titipan teal
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24 },
      6: { cellWidth: 20 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'Pemasukan') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // rose
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 7) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  // Footer & Signatures on final page
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const remainingSpace = doc.internal.pageSize.getHeight() - finalY;

  // Add new page if space is too cramped for signatures
  if (remainingSpace < 45) {
    doc.addPage();
  }

  const signY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Dibuat & Diverifikasi:', 24, signY);
  doc.line(24, signY + 20, 68, signY + 20);
  doc.text(`(${userName})`, 24, signY + 25);
  doc.text(`Role: ${userRole}`, 24, signY + 29);

  doc.text('Mengetahui & Menyetujui:', pageWidth - 70, signY);
  doc.line(pageWidth - 70, signY + 20, pageWidth - 26, signY + 20);
  doc.text('(Super Admin Titipan)', pageWidth - 70, signY + 25);
  doc.text('Moving & Storage Management', pageWidth - 70, signY + 29);

  // Filename
  const fileName = `Laporan_Cashflow_Titipan_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
