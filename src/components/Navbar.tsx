import React from 'react';
import { Menu, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TitipanLogo } from './TitipanLogo';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: 'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log';
  onOpenNewTransaction?: (type?: 'income' | 'expense') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab }) => {
  const { currentUser, signIn } = useAuth();

  const getPageInfo = () => {
    switch (activeTab) {
      case 'tracking':
        return {
          title: 'Tracking Delivery & Pengiriman',
          desc: 'Monitoring langsung armada pindahan, rute peta GPS & data konsumen',
        };
      case 'laporan_grafik':
        return {
          title: 'Grafik & Laporan Keuangan',
          desc: 'Analitik visual pemasukan, pengeluaran & performa saldo bulanan',
        };
      case 'kategori':
        return {
          title: 'Manajemen Data Kategori',
          desc: '55 pos pengeluaran & 4 termin pembayaran resmi Titipan',
        };
      case 'pengguna':
        return {
          title: 'Manajemen User & Hak Akses',
          desc: 'Kelola otorisasi peran Admin dan Superadmin',
        };
      case 'audit_log':
        return {
          title: 'Audit Log & Riwayat Perubahan Kas',
          desc: 'Transparansi penuh mutasi kas, koreksi nominal, dan otorisasi pengguna',
        };
      case 'arus_kas':
      default:
        return {
          title: 'Arus Kas Harian',
          desc: 'Pencatatan mutasi transaksi kas operasional Titipan',
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-[#FFFDFA] border-b border-slate-200 sticky top-0 z-30 shadow-2xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Hamburger (mobile) + Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo */}
            <div className="md:hidden">
              <TitipanLogo size="sm" variant="full" />
            </div>

            {/* Desktop Page Title & Breadcrumb */}
            <div className="hidden md:block">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight">
                {pageInfo.title}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                {pageInfo.desc}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {!currentUser && (
              <button
                type="button"
                onClick={signIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#117181] hover:bg-[#0c4f5b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
