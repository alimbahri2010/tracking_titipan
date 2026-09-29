export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatNumberId(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function parseNumberId(value: string): number {
  const clean = value.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_SHORT_ID[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatIndoFullDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${MONTH_NAMES_ID[monthIdx]} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const PAYMENT_METHODS = [
  'Kas Tunai (Cash)',
  'Transfer Bank BCA',
  'Transfer Bank Mandiri',
  'Transfer Bank BRI',
  'Transfer Bank BNI',
  'QRIS Titipan',
  'Giro / Cek Perusahaan',
  'Lainnya',
];

export const EXPENSE_GROUPS = [
  'Pembelian Aset',
  'Material Packing',
  'Operasional Transport',
  'Biaya Layanan Lain',
  'Lain-lain & Overhead',
  'SDM Lapangan (Harian)',
  'Gaji Tetap',
  'Marketing & Teknologi',
  'Sewa Armada (Vendor)',
  'Refund Customer',
  'Vendor Pindahan/Packing',
];

export const DEFAULT_CATEGORIES = [
  // 4 Kategori Pemasukan Resmi Titipan (Sesuai Termin Pembayaran)
  {
    name: 'DP 10%',
    type: 'income' as const,
    group: 'Termin Pembayaran',
    color: '#059669',
    icon: 'Percent',
    isDefault: true,
    isActive: true,
  },
  {
    name: 'DP 40%',
    type: 'income' as const,
    group: 'Termin Pembayaran',
    color: '#059669',
    icon: 'Percent',
    isDefault: true,
    isActive: true,
  },
  {
    name: 'DP 80%',
    type: 'income' as const,
    group: 'Termin Pembayaran',
    color: '#059669',
    icon: 'Percent',
    isDefault: true,
    isActive: true,
  },
  {
    name: 'Pelunasan',
    type: 'income' as const,
    group: 'Termin Pembayaran',
    color: '#059669',
    icon: 'CheckCircle2',
    isDefault: true,
    isActive: true,
  },

  // 55 Kategori Pengeluaran Resmi Titipan
  { name: 'Aset blanket', type: 'expense' as const, group: 'Pembelian Aset', color: '#64748b', icon: 'Shield', isDefault: true, isActive: true },
  { name: 'Aset trackbelt', type: 'expense' as const, group: 'Pembelian Aset', color: '#64748b', icon: 'Wrench', isDefault: true, isActive: true },
  { name: 'Aset troli', type: 'expense' as const, group: 'Pembelian Aset', color: '#64748b', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Asset Toolkit', type: 'expense' as const, group: 'Pembelian Aset', color: '#64748b', icon: 'Wrench', isDefault: true, isActive: true },
  { name: 'Baut', type: 'expense' as const, group: 'Material Packing', color: '#4f46e5', icon: 'Box', isDefault: true, isActive: true },
  { name: 'Bensin Motor', type: 'expense' as const, group: 'Operasional Transport', color: '#0284c7', icon: 'Fuel', isDefault: true, isActive: true },
  { name: 'Biaya Copot AC', type: 'expense' as const, group: 'Biaya Layanan Lain', color: '#0d9488', icon: 'Wrench', isDefault: true, isActive: true },
  { name: 'Biaya lain-lain', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'AlertCircle', isDefault: true, isActive: true },
  { name: 'Biaya Notaris', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'FileText', isDefault: true, isActive: true },
  { name: 'Biaya Survey', type: 'expense' as const, group: 'Biaya Layanan Lain', color: '#0d9488', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Bonus', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Award', isDefault: true, isActive: true },
  { name: 'Bubblewrap', type: 'expense' as const, group: 'Material Packing', color: '#4f46e5', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Driver', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Fee Fathur', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Fee Harian', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Clock', isDefault: true, isActive: true },
  { name: 'Freelance VCC', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Gaji Admin', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Gaji Desain Grafis', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'Palette', isDefault: true, isActive: true },
  { name: 'Gaji HR-Finance', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'DollarSign', isDefault: true, isActive: true },
  { name: 'Gaji Intern Finance', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Gaji Marketing', type: 'expense' as const, group: 'Gaji Tetap', color: '#8b5cf6', icon: 'TrendingUp', isDefault: true, isActive: true },
  { name: 'Gopay Topup', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'CreditCard', isDefault: true, isActive: true },
  { name: 'Invest Teknologi', type: 'expense' as const, group: 'Marketing & Teknologi', color: '#06b6d4', icon: 'Cpu', isDefault: true, isActive: true },
  { name: 'Kantor', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Building', isDefault: true, isActive: true },
  { name: 'Kardus', type: 'expense' as const, group: 'Material Packing', color: '#4f46e5', icon: 'Box', isDefault: true, isActive: true },
  { name: 'Kartu Nama', type: 'expense' as const, group: 'Marketing & Teknologi', color: '#06b6d4', icon: 'CreditCard', isDefault: true, isActive: true },
  { name: 'Kontrakan', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Building', isDefault: true, isActive: true },
  { name: 'Lakban', type: 'expense' as const, group: 'Material Packing', color: '#4f46e5', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Lembur', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Clock', isDefault: true, isActive: true },
  { name: 'Meta Ads', type: 'expense' as const, group: 'Marketing & Teknologi', color: '#06b6d4', icon: 'Megaphone', isDefault: true, isActive: true },
  { name: 'Operasional Mobil Rental', type: 'expense' as const, group: 'Sewa Armada (Vendor)', color: '#f97316', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Operasional tim lapangan', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Ops CEO', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Parkiran', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Receipt', isDefault: true, isActive: true },
  { name: 'Perjalanan Dinas', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'PIC', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Plastik Wrapping', type: 'expense' as const, group: 'Material Packing', color: '#4f46e5', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Print', type: 'expense' as const, group: 'Marketing & Teknologi', color: '#06b6d4', icon: 'Printer', isDefault: true, isActive: true },
  { name: 'Pungli Komplek', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'AlertCircle', isDefault: true, isActive: true },
  { name: 'Refund Customer', type: 'expense' as const, group: 'Refund Customer', color: '#ef4444', icon: 'RotateCcw', isDefault: true, isActive: true },
  { name: 'Rental Mobil', type: 'expense' as const, group: 'Operasional Transport', color: '#0284c7', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Seragam', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Users', isDefault: true, isActive: true },
  { name: 'Storage', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'Warehouse', isDefault: true, isActive: true },
  { name: 'Tanpa Kategori', type: 'expense' as const, group: 'Lain-lain & Overhead', color: '#94a3b8', icon: 'AlertCircle', isDefault: true, isActive: true },
  { name: 'Uang Makan Lapangan', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Utensils', isDefault: true, isActive: true },
  { name: 'Uang Makan Lembur', type: 'expense' as const, group: 'SDM Lapangan (Harian)', color: '#f59e0b', icon: 'Utensils', isDefault: true, isActive: true },
  { name: 'Vendor Jasa Pindahan', type: 'expense' as const, group: 'Vendor Pindahan/Packing', color: '#d97706', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Vendor Packing Bali', type: 'expense' as const, group: 'Vendor Pindahan/Packing', color: '#d97706', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Vendor Packing Bandung', type: 'expense' as const, group: 'Vendor Pindahan/Packing', color: '#d97706', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Vendor Packing Jogja', type: 'expense' as const, group: 'Vendor Pindahan/Packing', color: '#d97706', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Vendor Packing Surabaya', type: 'expense' as const, group: 'Vendor Pindahan/Packing', color: '#d97706', icon: 'Package', isDefault: true, isActive: true },
  { name: 'Vendor Pickup Jabodetabek', type: 'expense' as const, group: 'Sewa Armada (Vendor)', color: '#f97316', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Vendor Pickup luar Jabodetabek', type: 'expense' as const, group: 'Sewa Armada (Vendor)', color: '#f97316', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Vendor Truk Jabodetabek', type: 'expense' as const, group: 'Sewa Armada (Vendor)', color: '#f97316', icon: 'Truck', isDefault: true, isActive: true },
  { name: 'Vendor Truk luar Jabodetabek', type: 'expense' as const, group: 'Sewa Armada (Vendor)', color: '#f97316', icon: 'Truck', isDefault: true, isActive: true },
];
