import React, { useState } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TitipanLogo } from './TitipanLogo';
import { formatRupiah } from '../utils/formatters';

interface TrackingData {
  orderId: string;
  serviceType: string;
  status: 'confirmed' | 'packing' | 'in_transit' | 'completed';
  statusLabel: string;
  origin: string;
  destination: string;
  scheduledDate: string;
  estimatedArrival: string;
  driverName: string;
  driverPhone: string;
  truckPlate: string;
  truckType: string;
  totalAmount: number;
  paymentStatus: 'Lunas' | 'DP Diterima' | 'Menunggu Pembayaran';
  itemsSummary: string;
  timeline: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
    current?: boolean;
  }[];
}

const SAMPLE_ORDERS: { [id: string]: TrackingData } = {
  'TTP-2026-0929-JKT': {
    orderId: 'TTP-2026-0929-JKT',
    serviceType: 'Pindahan Rumah Full Service',
    status: 'in_transit',
    statusLabel: 'Armada Dalam Perjalanan',
    origin: 'Jl. Teuku Cik Ditiro No. 42, Menteng, Jakarta Pusat',
    destination: 'Cluster Greenwich Park, BSD City, Tangerang Selatan',
    scheduledDate: '29 September 2026',
    estimatedArrival: 'Hari Ini, 16:45 WIB',
    driverName: 'Pak Joko Santoso',
    driverPhone: '0812-9988-7711',
    truckPlate: 'B 9281 UXT',
    truckType: 'Truk Engkel Box (Kapasitas 14 CBM)',
    totalAmount: 3850000,
    paymentStatus: 'DP Diterima',
    itemsSummary: 'Kulkas 2 Pintu, Sofa 3 Seater, Kasur King Size, 18 Box Kardus Barang Pecah Belah',
    timeline: [
      {
        title: 'Booking Dikonfirmasi & Survey Armada',
        description: 'Jadwal pindahan disetujui, armada & tim lapangan telah ditugaskan.',
        time: '28 Sep, 10:30 WIB',
        completed: true,
      },
      {
        title: 'Packing & Wrapping Barang',
        description: 'Tim Titipan selesai membungkus perabot & barang pecah belah dengan bubble wrap tebal.',
        time: '29 Sep, 09:15 WIB',
        completed: true,
      },
      {
        title: 'Loading Barang ke Truk',
        description: 'Seluruh barang telah dimuat dengan aman ke armada B 9281 UXT.',
        time: '29 Sep, 12:45 WIB',
        completed: true,
      },
      {
        title: 'Armada Sedang Bergerak ke Lokasi Tujuan',
        description: 'Truk melintasi Tol JORR 2 menuju Cluster Greenwich Park BSD.',
        time: '29 Sep, 14:20 WIB',
        completed: false,
        current: true,
      },
      {
        title: 'Bongkar & Penataan di Lokasi Baru',
        description: 'Penyusunan perabot di ruangan sesuai denah permintaan konsumen.',
        time: 'Estimasi 16:45 WIB',
        completed: false,
      },
    ],
  },
  'TTP-2026-0915-BDG': {
    orderId: 'TTP-2026-0915-BDG',
    serviceType: 'Pindahan Kantor & Storage',
    status: 'completed',
    statusLabel: 'Pindahan Selesai & Serah Terima',
    origin: 'Gedung Wisma GKBI Lt. 12, Sudirman, Jakarta Pusat',
    destination: 'Ruko Dago Asri No. 8, Bandung',
    scheduledDate: '15 September 2026',
    estimatedArrival: '15 Sep, 17:30 WIB',
    driverName: 'Pak Hendra Pratama',
    driverPhone: '0813-1122-3344',
    truckPlate: 'B 9412 KRT',
    truckType: 'Truk CDD Long Box',
    totalAmount: 6500000,
    paymentStatus: 'Lunas',
    itemsSummary: '24 Meja Kerja, 28 Kursi Ergonomis, 4 Lemari Dokumen, Brankas 120kg',
    timeline: [
      {
        title: 'Booking Dikonfirmasi',
        description: 'Invoice & jadwal disetujui.',
        time: '14 Sep, 14:00 WIB',
        completed: true,
      },
      {
        title: 'Packing & Loading Kantor',
        description: 'Packing dokumen rahasia & inventaris kantor selesai.',
        time: '15 Sep, 08:00 WIB',
        completed: true,
      },
      {
        title: 'Perjalanan Jakarta - Bandung',
        description: 'Armada tiba di Bandung via Tol Cipularang.',
        time: '15 Sep, 13:45 WIB',
        completed: true,
      },
      {
        title: 'Selesai & Serah Terima Kunci',
        description: 'Pekerjaan selesai 100% tanpa kerusakan barang.',
        time: '15 Sep, 17:30 WIB',
        completed: true,
      },
    ],
  },
};

export const TrackingConsumerPortal: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const [searchInput, setSearchInput] = useState<string>('TTP-2026-0929-JKT');
  const [activeOrder, setActiveOrder] = useState<TrackingData>(SAMPLE_ORDERS['TTP-2026-0929-JKT']);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) return;

    if (SAMPLE_ORDERS[query]) {
      setActiveOrder(SAMPLE_ORDERS[query]);
      setSearchError(null);
    } else {
      setSearchError(`Nomor resi / order "${query}" tidak ditemukan. Coba gunakan "TTP-2026-0929-JKT" atau "TTP-2026-0915-BDG".`);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF3F8] text-slate-800 flex flex-col justify-between font-sans antialiased">
      {/* Top Navbar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TitipanLogo size="md" variant="full" />
            <span className="hidden sm:inline-block h-5 w-[1px] bg-slate-200 mx-1"></span>
            <div className="hidden sm:block">
              <span className="text-xs font-black uppercase tracking-wider text-[#0e6e7d] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Portal Konsumen
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.displayName || 'Konsumen Titipan'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Tracking Pengiriman Aktif</p>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* Search Hero Card */}
        <div className="bg-gradient-to-br from-[#0e6e7d] via-[#0c4f5b] to-[#05262c] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300">
              <Truck className="w-3.5 h-3.5" />
              <span>Live Tracking Ekspedisi Pindahan</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Lacak Perjalanan &amp; Status Armada Pindahan Anda
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-medium">
              Pantau pergerakan armada Titipan Moving, estimasi waktu tiba di lokasi tujuan, dan rincian kontak kru bertugas.
            </p>

            {/* Tracking Search Input Form */}
            <form onSubmit={handleSearch} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Masukkan Nomor Resi / Booking (contoh: TTP-2026-0929-JKT)"
                  className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 text-xs sm:text-sm font-bold rounded-xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Cek Status
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/40">
                {searchError}
              </p>
            )}
          </div>
        </div>

        {/* Active Order Details & Status Card */}
        <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Top Order Status Banner */}
          <div className="p-4 sm:px-6 sm:py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">No. Resi:</span>
                <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                  {activeOrder.orderId}
                </span>
                <span
                  className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    activeOrder.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  }`}
                >
                  {activeOrder.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {activeOrder.serviceType} • Jadwal: <strong>{activeOrder.scheduledDate}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block font-semibold">Estimasi Tiba di Lokasi:</span>
              <span className="text-sm sm:text-base font-black text-[#0e6e7d] flex items-center gap-1 justify-end">
                <Clock className="w-4 h-4 text-[#0e6e7d]" />
                <span>{activeOrder.estimatedArrival}</span>
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Timeline & Delivery Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Route Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    A
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lokasi Muat (Asal)
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{activeOrder.origin}</p>
                  </div>
                </div>

                <div className="ml-3 pl-3 border-l-2 border-dashed border-slate-300 py-1 text-xs font-bold text-slate-400">
                  Rute Pengantaran Armada Titipan
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    B
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lokasi Bongkar (Tujuan)
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{activeOrder.destination}</p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Progress Timeline */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0e6e7d]" />
                  <span>Riwayat Aktivitas Pindahan</span>
                </h3>

                <div className="relative pl-3 space-y-4">
                  {activeOrder.timeline.map((step, idx) => {
                    const isLast = idx === activeOrder.timeline.length - 1;
                    return (
                      <div key={idx} className="relative flex items-start gap-3 group">
                        {!isLast && (
                          <div
                            className={`absolute left-[11px] top-[24px] bottom-[-16px] w-[2px] ${
                              step.completed ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}

                        <div className="relative z-10 shrink-0">
                          {step.completed ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : step.current ? (
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-amber-100 animate-pulse">
                              <Truck className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-xs font-bold ${
                                step.current
                                  ? 'text-amber-900 font-extrabold'
                                  : step.completed
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">{step.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Driver, Truck, & Invoice Info */}
            <div className="space-y-4">
              {/* Driver & Armada Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Informasi Kru &amp; Armada
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0e6e7d] text-white flex items-center justify-center font-black text-sm">
                    {activeOrder.driverName[4] || 'D'}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">{activeOrder.driverName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Driver Utama &amp; Koordinator Tim</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Armada:</span>
                    <strong className="text-slate-800">{activeOrder.truckType}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Plat Nomor:</span>
                    <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {activeOrder.truckPlate}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/62${activeOrder.driverPhone.replace(/[^0-9]/g, '').slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hubungi Driver (WhatsApp)</span>
                </a>
              </div>

              {/* Items & Payment Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Detail Barang &amp; Pembayaran
                </span>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-500 block text-[11px]">Ringkasan Muatan:</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {activeOrder.itemsSummary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Biaya Pindahan:</span>
                    <strong className="text-slate-900 text-sm">{formatRupiah(activeOrder.totalAmount)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      <span>Garansi Proteksi Barang</span>
                    </div>
                    <p className="text-amber-800/90 leading-tight">
                      Seluruh barang Anda dilindungi garansi aman sampai di tujuan oleh tim Titipan Moving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-xs text-slate-500 text-center">
        <p>© {new Date().getFullYear()} Titipan Moving &amp; Storage — Layanan Pindahan Rumah, Apartemen, Kantor &amp; Gudang Terpercaya.</p>
      </footer>
    </div>
  );
};
