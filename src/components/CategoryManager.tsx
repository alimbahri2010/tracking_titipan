import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  Check,
  RefreshCw,
  FolderTree,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCashflow } from '../context/CashflowContext';
import { useAuth } from '../context/AuthContext';
import { Category, TransactionType } from '../types';
import { EXPENSE_GROUPS } from '../utils/formatters';

const COLOR_PALETTE = [
  '#117181', // Titipan green
  '#0284c7', // Sky blue
  '#059669', // Emerald
  '#10b981', // Mint
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#8b5cf6', // Purple
  '#c026d3', // Fuchsia
  '#4f46e5', // Indigo
  '#64748b', // Slate
  '#94a3b8', // Gray
];

export const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, syncOfficialCategories } =
    useCashflow();
  const { isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('expense');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [group, setGroup] = useState<string>('Operasional Transport');
  const [customGroup, setCustomGroup] = useState<string>('');
  const [color, setColor] = useState<string>('#ef4444');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Extract all distinct groups
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.group) set.add(c.group);
    });
    EXPENSE_GROUPS.forEach((g) => set.add(g));
    return Array.from(set).sort();
  }, [categories]);

  const handleOpenAdd = (defaultT: TransactionType = 'expense') => {
    setEditingCategory(null);
    setName('');
    setType(defaultT);
    setGroup(defaultT === 'income' ? 'Pendapatan Operasional' : 'SDM Lapangan (Harian)');
    setCustomGroup('');
    setColor(defaultT === 'income' ? '#059669' : '#ef4444');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setGroup(cat.group || (cat.type === 'income' ? 'Pendapatan Operasional' : 'Lain-lain & Overhead'));
    setCustomGroup('');
    setColor(cat.color || '#0e6e7d');
    setIsModalOpen(true);
  };

  const handleSyncAllOfficial = async () => {
    setSyncStatus('Menyinkronkan...');
    try {
      const addedCount = await syncOfficialCategories();
      if (addedCount > 0) {
        setSyncStatus(`Berhasil menambahkan ${addedCount} kategori resmi!`);
      } else {
        setSyncStatus('Semua 55 kategori resmi sudah lengkap dan tersinkronisasi.');
      }
      setTimeout(() => setSyncStatus(null), 3500);
    } catch {
      setSyncStatus('Gagal menyinkronkan kategori.');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalGroup = customGroup.trim() || group;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          group: finalGroup,
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          group: finalGroup,
          color,
          isActive: true,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCategory(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Gagal menghapus kategori. Pastikan Anda memiliki hak Superadmin.');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
    } catch (err) {
      console.error('Failed to toggle category state:', err);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (activeTab !== 'all' && c.type !== activeTab) return false;
      if (selectedGroup !== 'all' && c.group !== selectedGroup) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(query);
        const matchGroup = c.group?.toLowerCase().includes(query);
        if (!matchName && !matchGroup) return false;
      }
      return true;
    });
  }, [categories, activeTab, selectedGroup, searchQuery]);

  const expenseCategoriesCount = categories.filter((c) => c.type === 'expense').length;
  const incomeCategoriesCount = categories.filter((c) => c.type === 'income').length;

  return (
    <div className="space-y-5">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Manajemen Data Kategori Cashflow
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data pos pemasukan & 55 kategori pengeluaran terstruktur lengkap dengan pembagian grup
            operasional Titipan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllOfficial}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-teal-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Pastikan semua 55 kategori resmi termuat lengkap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkron 55 Kategori Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('expense')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kategori Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('income')}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kategori Pemasukan</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between animate-in fade-in">
          <span>{syncStatus}</span>
          <button
            type="button"
            onClick={() => setSyncStatus(null)}
            className="text-amber-700 hover:text-amber-950 font-black text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFDFA] rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main Type Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>🔴 Kategori Pengeluaran ({expenseCategoriesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>🟢 Kategori Pemasukan ({incomeCategoriesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#117181] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({categories.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kategori atau grup..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Reset
              </button>
            )}
          </div>

          {/* Table vs Grid Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Kartu
            </button>
          </div>
        </div>

        {/* Group Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1 shrink-0 text-[11px]">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Filter Grup:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 text-[11px] transition-all ${
              selectedGroup === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Grup
          </button>
          {allGroups.map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 text-[11px] transition-all ${
                selectedGroup === grp
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Category Display (Table View Matching Screenshot & Grid View) */}
      {viewMode === 'table' ? (
        <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Header matching user screenshot */}
          <div
            className={`px-5 py-3.5 border-b flex items-center justify-between ${
              activeTab === 'income'
                ? 'border-emerald-100 bg-emerald-50/70'
                : 'border-rose-100 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {activeTab === 'income' ? (
                <span className="text-base leading-none select-none">💚</span>
              ) : (
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-xs animate-pulse"></span>
              )}
              <h3
                className={`text-sm font-black uppercase tracking-wider ${
                  activeTab === 'income' ? 'text-emerald-800' : 'text-rose-950'
                }`}
              >
                {activeTab === 'expense'
                  ? 'Kategori PENGELUARAN'
                  : activeTab === 'income'
                  ? 'Kategori PEMASUKAN'
                  : 'Daftar Kategori Cashflow'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Menampilkan {filteredCategories.length} kategori
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b text-slate-600 font-extrabold uppercase tracking-wider text-[11px] ${
                    activeTab === 'income'
                      ? 'bg-emerald-50/30 border-emerald-100/70'
                      : 'bg-rose-50/30 border-rose-100/70'
                  }`}
                >
                  <th className="py-3 px-5 w-12 text-center">#</th>
                  <th className="py-3 px-5">NAMA</th>
                  <th className="py-3 px-5">GRUP</th>
                  <th className="py-3 px-4 text-center">TIPE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-5 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada kategori yang cocok dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, idx) => {
                    const isIncome = cat.type === 'income';

                    return (
                      <tr
                        key={cat.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          cat.isActive === false ? 'opacity-50 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-5">
                          {isIncome ? (
                            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200/60 font-black text-xs shadow-2xs">
                              {cat.name}
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: cat.color || '#ef4444' }}
                              ></span>
                              <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {cat.group ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {cat.group}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">- Belum ada grup -</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.isActive !== false
                                ? 'bg-emerald-100/70 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {cat.isActive !== false ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(cat)}
                              title={cat.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                cat.isActive !== false
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              title="Edit Kategori"
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(cat.id)}
                                title="Hapus Kategori (Superadmin)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCategories.map((cat) => {
            const isIncome = cat.type === 'income';

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  cat.isActive === false
                    ? 'opacity-60 bg-slate-50/50 border-dashed border-slate-300'
                    : 'border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || (isIncome ? '#059669' : '#ef4444') }}
                    >
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        title="Edit Kategori"
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(cat.id)}
                          title="Hapus Kategori (Superadmin)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">{cat.name}</h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {cat.group && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {cat.group}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-extrabold uppercase text-[10px] ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className="text-[10px] font-bold text-slate-500 hover:text-teal-700 cursor-pointer"
                  >
                    {cat.isActive !== false ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Type Switch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      if (!editingCategory) setColor('#ef4444');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🔴 Pengeluaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      if (!editingCategory) setColor('#059669');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🟢 Pemasukan</span>
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Aset troli, Baut, Driver, Lakban..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              {/* Group Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Grup Kategori (Operasional)
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white mb-2"
                >
                  {type === 'income' ? (
                    <>
                      <option value="Pendapatan Operasional">Pendapatan Operasional</option>
                      <option value="Pendapatan Layanan">Pendapatan Layanan</option>
                      <option value="Penjualan Material">Penjualan Material</option>
                      <option value="Pendapatan Lain">Pendapatan Lain</option>
                    </>
                  ) : (
                    EXPENSE_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))
                  )}
                  <option value="__custom__">+ Tulis Grup Kustom Sendiri</option>
                </select>

                {group === '__custom__' && (
                  <input
                    type="text"
                    required
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    placeholder="Masukkan nama grup kustom..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                )}
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Warna Indikator
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform flex items-center justify-center cursor-pointer ${
                        color === c ? 'scale-110 ring-2 ring-slate-800 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hapus Kategori?</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus kategori ini? Transaksi sebelumnya yang menggunakan
              kategori ini akan tetap tersimpan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
