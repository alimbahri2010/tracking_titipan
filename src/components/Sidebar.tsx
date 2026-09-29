import React from 'react';
import {
  Layers,
  BarChart3,
  Tag,
  Users,
  LogOut,
  X,
  History,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCashflow } from '../context/CashflowContext';
import { TitipanLogo } from './TitipanLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log';
  setActiveTab: (tab: 'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log') => void;
  onOpenNewTransaction?: (type?: 'income' | 'expense') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, userProfile, isSuperAdmin, signOut } = useAuth();
  const { usersList } = useCashflow();

  const pendingCount = usersList.filter((u) => u.status === 'pending').length;

  const navItems = [
    {
      id: 'arus_kas' as const,
      label: 'Arus Kas Harian',
      icon: Layers,
    },
    {
      id: 'tracking' as const,
      label: 'Tracking Order',
      icon: Compass,
      badge: 'Live',
    },
    {
      id: 'laporan_grafik' as const,
      label: 'Grafik & Laporan',
      icon: BarChart3,
    },
    {
      id: 'kategori' as const,
      label: 'Data Kategori',
      icon: Tag,
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'pengguna' as const,
            label: 'Manajemen User',
            icon: Users,
            badge: pendingCount > 0 ? `${pendingCount} Menunggu` : 'Super',
            isAlert: pendingCount > 0,
          },
        ]
      : []),
    {
      id: 'audit_log' as const,
      label: 'Audit Log & Riwayat',
      icon: History,
      badge: 'Audit',
    },
  ];

  const handleSelectTab = (tabId: 'arus_kas' | 'tracking' | 'laporan_grafik' | 'kategori' | 'pengguna' | 'audit_log') => {
    setActiveTab(tabId);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFDFA] border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <TitipanLogo size="md" variant="full" />
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 pt-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-[#117181] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#0c4f5b] text-amber-300'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#117181]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-none">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    item.isAlert
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-400 text-teal-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile & Logout Bottom Bar */}
      {currentUser && (
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFFDFA] border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-9 h-9 rounded-xl ring-1 ring-slate-200 object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#117181] text-white font-bold flex items-center justify-center text-xs shadow-inner shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {userProfile?.displayName || currentUser.displayName || 'Petugas Titipan'}
                </p>
                <span
                  className={`inline-block text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider mt-0.5 ${
                    isSuperAdmin
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-[#d9eff2] text-[#0c4f5b] border border-[#b5e1e7]'
                  }`}
                >
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FFFDFA] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
