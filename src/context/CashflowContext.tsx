import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { supabase } from '../supabase';
import {
  Transaction,
  Category,
  UserProfile,
  FilterState,
  CashflowSummary,
  UserRole,
  PreapprovedEmail,
  AuditLogEntry,
  AuditActionType,
  AuditLogChange,
  Project,
} from '../types';
import { useAuth } from './AuthContext';
import { DEFAULT_CATEGORIES, getTodayDateString, formatRupiah } from '../utils/formatters';

interface CashflowContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  categories: Category[];
  projects: Project[];
  usersList: UserProfile[];
  preapprovedList: PreapprovedEmail[];
  auditLogs: AuditLogEntry[];
  loading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  summary: CashflowSummary;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'createdByUid' | 'createdByName' | 'createdByEmail'>) => Promise<string>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Promise<string>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  syncOfficialCategories: () => Promise<number>;
  updateUserRole: (targetUid: string, newRole: UserRole) => Promise<void>;
  approveUser: (targetUid: string, role?: UserRole) => Promise<void>;
  rejectUser: (targetUid: string, reason?: string) => Promise<void>;
  deleteUserAccount: (targetUid: string) => Promise<void>;
  preapproveEmail: (email: string, role?: UserRole) => Promise<void>;
  removePreapproval: (id: string) => Promise<void>;
}

const CashflowContext = createContext<CashflowContextType | undefined>(undefined);

const LOCAL_TX_KEY = 'titipan_local_transactions';
const LOCAL_CAT_KEY = 'titipan_local_categories';
const LOCAL_AUDIT_KEY = 'titipan_local_audit_logs';

const initialFilters: FilterState = {
  search: '',
  type: 'all',
  categoryId: 'all',
  datePreset: 'this_month',
  startDate: '',
  endDate: '',
  paymentMethod: 'all',
  userUid: 'all',
};

// Obsolete placeholder income names to clean up
const OBSOLETE_INCOME_NAMES = new Set([
  'jasa pindahan rumah/kantor',
  'sewa gudang / storage',
  'jasa packing & wrapping',
  'bongkar pasang furniture',
  'penjualan kardus & bubble wrap',
  'pendapatan lain-lain',
]);

// Initial default categories with IDs for offline/fallback (includes 4 official income + 55 expense categories)
const FALLBACK_CATEGORIES: Category[] = DEFAULT_CATEGORIES.map((c, idx) => ({
  ...c,
  id: `cat_default_${idx + 1}`,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const CashflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isSuperAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [preapprovedList, setPreapprovedList] = useState<PreapprovedEmail[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Initialize from LocalStorage fallback if present, ensuring all official categories are merged and obsolete removed
  useEffect(() => {
    try {
      localStorage.removeItem(LOCAL_AUDIT_KEY);
      const savedTx = localStorage.getItem(LOCAL_TX_KEY);
      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      }
      const savedCat = localStorage.getItem(LOCAL_CAT_KEY);
      if (savedCat) {
        const parsed = JSON.parse(savedCat);
        if (Array.isArray(parsed)) {
          // Filter out obsolete income categories
          const cleaned = parsed.filter(
            (c: any) => !OBSOLETE_INCOME_NAMES.has(c.name.toLowerCase().trim())
          );
          const existingNames = new Set(cleaned.map((c: any) => c.name.toLowerCase().trim()));
          const missing = FALLBACK_CATEGORIES.filter((c) => !existingNames.has(c.name.toLowerCase().trim()));
          const merged = [...cleaned, ...missing];
          setCategories(merged);
          localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(merged));
        }
      } else {
        setCategories(FALLBACK_CATEGORIES);
        localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(FALLBACK_CATEGORIES));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  // Subscribe to Categories in Firestore if user is authenticated with Firebase Auth
  useEffect(() => {
    if (!currentUser) return;
    if (!auth.currentUser) {
      // Local demo mode, keep local categories
      return;
    }

    const catCollection = collection(db, 'categories');
    const unsub = onSnapshot(
      catCollection,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();
            DEFAULT_CATEGORIES.forEach((cat) => {
              const newDocRef = doc(collection(db, 'categories'));
              batch.set(newDocRef, {
                ...cat,
                id: newDocRef.id,
                createdAt: now,
                updatedAt: now,
              });
            });
            await batch.commit();
          } catch (seedErr) {
            console.warn('Failed to seed categories to Firestore:', seedErr);
          }
        } else {
          const list: Category[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Category);
          });
          list.sort((a, b) => a.name.localeCompare(b.name));
          setCategories(list);

          // Auto-seed missing official categories if any are missing
          const existingNames = new Set(list.map((c) => c.name.toLowerCase().trim()));
          const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name.toLowerCase().trim()));
          if (missing.length > 0) {
            try {
              const batch = writeBatch(db);
              const now = new Date().toISOString();
              missing.forEach((cat) => {
                const newDocRef = doc(collection(db, 'categories'));
                batch.set(newDocRef, {
                  ...cat,
                  id: newDocRef.id,
                  createdAt: now,
                  updatedAt: now,
                });
              });
              await batch.commit();
            } catch (err) {
              console.warn('Auto-seed missing categories failed:', err);
            }
          }
        }
      },
      (error) => {
        console.warn('Categories snapshot listener error:', error);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Load User Transactions & Projects from Supabase (enforces RLS per user)
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSupabaseUserData() {
      try {
        // Query user's private projects from Supabase (satisfies: "each user should only see their own projects")
        const { data: projData, error: projErr } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (isMounted && projData) {
          setProjects(projData as Project[]);
        }

        // Query user's private transactions from Supabase (Row Level Security protected)
        const { data: txData, error: txErr } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (isMounted && txData && txData.length > 0) {
          const list: Transaction[] = txData.map((row: any) => ({
            id: row.id,
            type: row.type,
            amount: Number(row.amount),
            categoryId: row.category_id,
            categoryName: row.category_name,
            categoryGroup: row.category_group,
            categoryColor: row.category_color,
            date: row.date,
            description: row.description,
            paymentMethod: row.payment_method,
            referenceNumber: row.reference_number,
            createdByUid: row.user_id,
            createdByName: currentUser?.displayName || 'Admin',
            createdByEmail: currentUser?.email || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          setTransactions(list);
        }
      } catch (err) {
        console.warn('Supabase query error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSupabaseUserData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Subscribe to Users list & Preapprovals
  useEffect(() => {
    if (!currentUser) return;

    if (!auth.currentUser) {
      // Populate demo user list with approved & pending users for testing
      setUsersList([
        {
          uid: 'superadmin_alim_titipan',
          email: 'alimbahri2010@gmail.com',
          displayName: 'Alim Bahri (Superadmin)',
          role: 'superadmin',
          status: 'approved',
          createdAt: new Date().toISOString(),
        },
        {
          uid: 'admin_operasional_titipan',
          email: 'admin.operasional@titipan.com',
          displayName: 'Admin Operasional Titipan',
          role: 'admin',
          status: 'approved',
          createdAt: new Date().toISOString(),
        },
        {
          uid: 'pending_user_demo_1',
          email: 'staff.gudang@titipan.com',
          displayName: 'Bambang Sudiro (Staf Gudang & Armada)',
          role: 'admin',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
      ]);

      setPreapprovedList([
        {
          id: 'finance_titipan_com',
          email: 'finance@titipan.com',
          role: 'admin',
          addedBy: 'alimbahri2010@gmail.com',
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const usersCollection = collection(db, 'users');
    const unsubUsers = onSnapshot(
      usersCollection,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setUsersList(list);
      },
      (error) => {
        console.warn('Users list snapshot error:', error);
      }
    );

    const preapprovalsCollection = collection(db, 'preapprovals');
    const unsubPre = onSnapshot(
      preapprovalsCollection,
      (snapshot) => {
        const list: PreapprovedEmail[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PreapprovedEmail);
        });
        setPreapprovedList(list);
      },
      (error) => {
        console.warn('Preapprovals snapshot error:', error);
      }
    );

    const auditCollection = collection(db, 'audit_logs');
    const unsubAudit = onSnapshot(
      auditCollection,
      (snapshot) => {
        const list: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEntry);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(list);
      },
      (error) => {
        console.warn('Audit logs snapshot error:', error);
      }
    );

    return () => {
      unsubUsers();
      unsubPre();
      unsubAudit();
    };
  }, [currentUser]);

  // Centralized audit logger
  const logAudit = async (entry: {
    action: AuditActionType;
    actionLabel: string;
    targetId?: string;
    targetType: 'transaction' | 'user' | 'category' | 'auth';
    summary: string;
    details?: AuditLogEntry['details'];
  }) => {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date().toISOString();
    const actorRole = (userProfile?.role || (isSuperAdmin ? 'superadmin' : 'admin')) as UserRole;

    const fullLog: AuditLogEntry = {
      id,
      timestamp,
      action: entry.action,
      actionLabel: entry.actionLabel,
      actorUid: currentUser?.uid || 'system',
      actorName: userProfile?.displayName || currentUser?.displayName || 'Petugas Titipan',
      actorEmail: currentUser?.email || '-',
      actorRole,
      targetId: entry.targetId,
      targetType: entry.targetType,
      summary: entry.summary,
      details: entry.details,
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'audit_logs', id), fullLog);
      } catch (err) {
        console.warn('Firestore write audit log error:', err);
      }
    }

    setAuditLogs((prev) => {
      const updated = [fullLog, ...prev.filter((l) => l.id !== id)];
      try {
        localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });
  };

  // Filter computation
  const filteredTransactions = useMemo(() => {
    const today = getTodayDateString();
    const now = new Date();

    return transactions.filter((tx) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchCat = tx.categoryName.toLowerCase().includes(query);
        const matchRef = tx.referenceNumber?.toLowerCase().includes(query);
        const matchUser = tx.createdByName?.toLowerCase().includes(query);
        if (!matchDesc && !matchCat && !matchRef && !matchUser) return false;
      }

      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) {
        return false;
      }

      if (filters.paymentMethod !== 'all' && tx.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      if (filters.userUid !== 'all' && tx.createdByUid !== filters.userUid) {
        return false;
      }

      const txDate = tx.date;
      if (filters.datePreset === 'today') {
        if (txDate !== today) return false;
      } else if (filters.datePreset === 'this_week') {
        const curr = new Date();
        const firstDayOfWeek = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const d = new Date(txDate);
        if (d < firstDayOfWeek) return false;
      } else if (filters.datePreset === 'this_month') {
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!txDate.startsWith(currentMonthPrefix)) return false;
      } else if (filters.datePreset === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (!txDate.startsWith(lastMonthPrefix)) return false;
      } else if (filters.datePreset === 'this_year') {
        const yearPrefix = `${now.getFullYear()}-`;
        if (!txDate.startsWith(yearPrefix)) return false;
      } else if (filters.datePreset === 'custom') {
        if (filters.startDate && txDate < filters.startDate) return false;
        if (filters.endDate && txDate > filters.endDate) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Financial summary computation
  const summary: CashflowSummary = useMemo(() => {
    const today = getTodayDateString();
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalIncome = 0;
    let totalExpense = 0;
    let todayIncome = 0;
    let todayExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
        if (tx.date === today) todayIncome += amount;
        if (tx.date.startsWith(currentMonthPrefix)) thisMonthIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
        if (tx.date === today) todayExpense += amount;
        if (tx.date.startsWith(currentMonthPrefix)) thisMonthExpense += amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      todayIncome,
      todayExpense,
      todayNet: todayIncome - todayExpense,
      thisMonthIncome,
      thisMonthExpense,
      thisMonthNet: thisMonthIncome - thisMonthExpense,
      totalTransactionsCount: transactions.length,
    };
  }, [transactions]);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt' | 'createdByUid' | 'createdByName' | 'createdByEmail'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum masuk');
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newTx: Transaction = {
      ...data,
      id,
      amount: Number(data.amount),
      createdByUid: currentUser.uid,
      createdByName: userProfile?.displayName || currentUser.displayName || 'Admin',
      createdByEmail: currentUser.email || '',
      createdAt: now,
      updatedAt: now,
    };

    // If authenticated user, persist to Supabase transactions table (protected by RLS)
    if (currentUser?.uid) {
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('transactions')
          .insert({
            type: data.type,
            amount: Number(data.amount),
            category_id: data.categoryId,
            category_name: data.categoryName,
            category_group: data.categoryGroup || null,
            category_color: data.categoryColor || null,
            date: data.date,
            description: data.description,
            payment_method: data.paymentMethod,
            reference_number: data.referenceNumber || null,
          })
          .select()
          .single();

        if (inserted?.id) {
          newTx.id = inserted.id;
        }
      } catch (err) {
        console.warn('Supabase insert transaction error:', err);
      }
    }

    // Always update local state
    setTransactions((prev) => [newTx, ...prev]);

    // Record audit log
    await logAudit({
      action: 'create_transaction',
      actionLabel: 'Pencatatan Transaksi Baru',
      targetId: newTx.id,
      targetType: 'transaction',
      summary: `Mencatat ${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} "${data.description}" sebesar ${formatRupiah(Number(data.amount))} via ${data.paymentMethod}`,
      details: {
        transactionType: data.type,
        amount: Number(data.amount),
        categoryName: data.categoryName,
        description: data.description,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      },
    });

    return newTx.id;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>): Promise<void> => {
    const now = new Date().toISOString();
    const oldTx = transactions.find((t) => t.id === id);

    if (currentUser?.uid) {
      try {
        await supabase
          .from('transactions')
          .update({
            type: data.type,
            amount: data.amount !== undefined ? Number(data.amount) : undefined,
            category_id: data.categoryId,
            category_name: data.categoryName,
            category_group: data.categoryGroup,
            category_color: data.categoryColor,
            date: data.date,
            description: data.description,
            payment_method: data.paymentMethod,
            reference_number: data.referenceNumber,
            updated_at: now,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update transaction error:', err);
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: now } : t))
    );

    // Calculate detailed diff for audit transparency
    const changes: AuditLogChange[] = [];
    if (oldTx) {
      if (data.amount !== undefined && Number(data.amount) !== oldTx.amount) {
        changes.push({
          field: 'amount',
          fieldLabel: 'Nominal',
          oldValue: formatRupiah(oldTx.amount),
          newValue: formatRupiah(Number(data.amount)),
        });
      }
      if (data.description !== undefined && data.description !== oldTx.description) {
        changes.push({
          field: 'description',
          fieldLabel: 'Keterangan',
          oldValue: oldTx.description,
          newValue: data.description,
        });
      }
      if (data.categoryName !== undefined && data.categoryName !== oldTx.categoryName) {
        changes.push({
          field: 'categoryName',
          fieldLabel: 'Kategori',
          oldValue: oldTx.categoryName,
          newValue: data.categoryName,
        });
      }
      if (data.paymentMethod !== undefined && data.paymentMethod !== oldTx.paymentMethod) {
        changes.push({
          field: 'paymentMethod',
          fieldLabel: 'Metode Pembayaran',
          oldValue: oldTx.paymentMethod,
          newValue: data.paymentMethod,
        });
      }
      if (data.date !== undefined && data.date !== oldTx.date) {
        changes.push({
          field: 'date',
          fieldLabel: 'Tanggal Transaksi',
          oldValue: oldTx.date,
          newValue: data.date,
        });
      }
      if (data.referenceNumber !== undefined && data.referenceNumber !== oldTx.referenceNumber) {
        changes.push({
          field: 'referenceNumber',
          fieldLabel: 'No. Invoice / Bukti',
          oldValue: oldTx.referenceNumber || '-',
          newValue: data.referenceNumber || '-',
        });
      }
    }

    await logAudit({
      action: 'update_transaction',
      actionLabel: 'Perubahan Data Transaksi',
      targetId: id,
      targetType: 'transaction',
      summary: `Memperbarui transaksi "${oldTx?.description || data.description || id}"`,
      details: {
        transactionType: data.type || oldTx?.type,
        amount: data.amount !== undefined ? Number(data.amount) : oldTx?.amount,
        categoryName: data.categoryName || oldTx?.categoryName,
        description: data.description || oldTx?.description,
        changes,
      },
    });
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const targetTx = transactions.find((t) => t.id === id);

    if (currentUser?.uid) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete transaction error:', err);
      }
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (targetTx) {
      await logAudit({
        action: 'delete_transaction',
        actionLabel: 'Penghapusan Transaksi',
        targetId: id,
        targetType: 'transaction',
        summary: `Menghapus transaksi ${targetTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} "${targetTx.description}" sebesar ${formatRupiah(targetTx.amount)}`,
        details: {
          transactionType: targetTx.type,
          amount: targetTx.amount,
          categoryName: targetTx.categoryName,
          description: targetTx.description,
          paymentMethod: targetTx.paymentMethod,
          referenceNumber: targetTx.referenceNumber,
        },
      });
    }
  };

  const addProject = async (name: string, description?: string): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => [data as Project, ...prev]);
    return data as Project;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      )
    );
  };

  const deleteProject = async (id: string): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addCategory = async (cat: Omit<Category, 'id' | 'createdAt'>): Promise<string> => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const newCategory: Category = {
      ...cat,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (auth.currentUser) {
      try {
        const newDocRef = doc(db, 'categories', id);
        await setDoc(newDocRef, newCategory);
      } catch (err) {
        console.warn('Firestore category write failed:', err);
      }
    }

    setCategories((prev) => [...prev, newCategory]);
    return id;
  };

  const updateCategory = async (id: string, cat: Partial<Category>): Promise<void> => {
    const now = new Date().toISOString();

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'categories', id);
        await setDoc(docRef, { ...cat, updatedAt: now }, { merge: true });
      } catch (err) {
        console.warn('Firestore category update failed:', err);
      }
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cat, updatedAt: now } : c))
    );
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'categories', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firestore category delete failed:', err);
      }
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const syncOfficialCategories = async (): Promise<number> => {
    // Purge obsolete income categories
    const currentCleaned = categories.filter(
      (c) => !OBSOLETE_INCOME_NAMES.has(c.name.toLowerCase().trim())
    );
    const existingNames = new Set(currentCleaned.map((c) => c.name.toLowerCase().trim()));
    const missing = DEFAULT_CATEGORIES.filter(
      (c) => !existingNames.has(c.name.toLowerCase().trim())
    );

    const now = new Date().toISOString();
    const newCategories: Category[] = missing.map((c, idx) => ({
      ...c,
      id: `cat_official_${Date.now()}_${idx + 1}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    if (auth.currentUser) {
      try {
        const batch = writeBatch(db);
        // Delete obsolete ones from Firestore
        const obsoleteList = categories.filter((c) =>
          OBSOLETE_INCOME_NAMES.has(c.name.toLowerCase().trim())
        );
        obsoleteList.forEach((c) => {
          batch.delete(doc(db, 'categories', c.id));
        });
        // Add missing
        newCategories.forEach((cat) => {
          const docRef = doc(db, 'categories', cat.id);
          batch.set(docRef, cat);
        });
        await batch.commit();
      } catch (err) {
        console.warn('Firestore syncOfficialCategories batch write failed:', err);
      }
    }

    const updated = [...currentCleaned, ...newCategories];
    setCategories(updated);
    localStorage.setItem(LOCAL_CAT_KEY, JSON.stringify(updated));
    return newCategories.length;
  };

  const updateUserRole = async (targetUid: string, newRole: UserRole): Promise<void> => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang dapat mengubah role pengguna');
    }

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(userDocRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });

        const adminDocRef = doc(db, 'admins', targetUid);
        if (newRole === 'superadmin') {
          const targetUser = usersList.find((u) => u.uid === targetUid);
          await setDoc(adminDocRef, {
            uid: targetUid,
            email: targetUser?.email || '',
            role: 'superadmin',
            assignedAt: new Date().toISOString(),
          });
        } else {
          await deleteDoc(adminDocRef);
        }
      } catch (err) {
        console.warn('Firestore user role update failed:', err);
      }
    }

    setUsersList((prev) =>
      prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
    );

    const targetUser = usersList.find((u) => u.uid === targetUid);
    await logAudit({
      action: 'change_user_role',
      actionLabel: 'Perubahan Peran Pengguna',
      targetId: targetUid,
      targetType: 'user',
      summary: `Mengubah hak akses ${targetUser?.displayName || targetUid} menjadi ${newRole.toUpperCase()}`,
      details: {
        targetUserName: targetUser?.displayName,
        targetUserEmail: targetUser?.email,
      },
    });
  };

  const approveUser = async (targetUid: string, role: UserRole = 'admin') => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang memiliki izin memberikan verifikasi akun');
    }
    const now = new Date().toISOString();

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(
          userDocRef,
          {
            status: 'approved',
            role,
            approvedBy: currentUser?.email || 'Superadmin',
            approvedAt: now,
            updatedAt: now,
          },
          { merge: true }
        );

        const adminDocRef = doc(db, 'admins', targetUid);
        if (role === 'superadmin') {
          const targetUser = usersList.find((u) => u.uid === targetUid);
          await setDoc(
            adminDocRef,
            {
              uid: targetUid,
              email: targetUser?.email || '',
              role: 'superadmin',
              assignedAt: now,
            },
            { merge: true }
          );
        } else {
          await deleteDoc(adminDocRef).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to approve user in Firestore:', err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }

    setUsersList((prev) =>
      prev.map((u) =>
        u.uid === targetUid
          ? {
              ...u,
              status: 'approved',
              role,
              approvedBy: currentUser?.email || 'Superadmin',
              approvedAt: now,
            }
          : u
      )
    );

    const targetUser = usersList.find((u) => u.uid === targetUid);
    await logAudit({
      action: 'approve_user',
      actionLabel: 'Verifikasi Akun Admin Disetujui',
      targetId: targetUid,
      targetType: 'user',
      summary: `Menyetujui akun ${targetUser?.displayName || targetUid} (${targetUser?.email || '-'}) sebagai ${role.toUpperCase()}`,
      details: {
        targetUserName: targetUser?.displayName,
        targetUserEmail: targetUser?.email,
      },
    });
  };

  const rejectUser = async (targetUid: string, reason = 'Akses ditolak oleh Superadmin') => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang memiliki izin menolak akses akun');
    }
    const now = new Date().toISOString();

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await setDoc(
          userDocRef,
          {
            status: 'rejected',
            rejectedReason: reason,
            updatedAt: now,
          },
          { merge: true }
        );
        await deleteDoc(doc(db, 'admins', targetUid)).catch(() => {});
      } catch (err) {
        console.error('Failed to reject user in Firestore:', err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
      }
    }

    setUsersList((prev) =>
      prev.map((u) =>
        u.uid === targetUid ? { ...u, status: 'rejected', rejectedReason: reason } : u
      )
    );

    const targetUser = usersList.find((u) => u.uid === targetUid);
    await logAudit({
      action: 'reject_user',
      actionLabel: 'Penolakan Akses Akun',
      targetId: targetUid,
      targetType: 'user',
      summary: `Menolak permohonan akun ${targetUser?.displayName || targetUid} (${targetUser?.email || '-'})`,
      details: {
        targetUserName: targetUser?.displayName,
        targetUserEmail: targetUser?.email,
        metadata: { reason },
      },
    });
  };

  const deleteUserAccount = async (targetUid: string) => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang dapat menghapus akun pengguna');
    }

    const targetUser = usersList.find((u) => u.uid === targetUid);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', targetUid));
        await deleteDoc(doc(db, 'admins', targetUid)).catch(() => {});
      } catch (err) {
        console.error('Failed to delete user doc:', err);
        handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}`);
      }
    }

    setUsersList((prev) => prev.filter((u) => u.uid !== targetUid));

    await logAudit({
      action: 'reject_user',
      actionLabel: 'Penghapusan Akun Pengguna',
      targetId: targetUid,
      targetType: 'user',
      summary: `Menghapus akun pengguna ${targetUser?.displayName || targetUid} (${targetUser?.email || '-'})`,
      details: {
        targetUserName: targetUser?.displayName,
        targetUserEmail: targetUser?.email,
      },
    });
  };

  const preapproveEmail = async (email: string, role: UserRole = 'admin') => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang dapat melakukan pra-verifikasi email');
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return;
    const cleanId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const now = new Date().toISOString();

    const record: PreapprovedEmail = {
      id: cleanId,
      email: cleanEmail,
      role,
      addedBy: currentUser?.email || 'Superadmin',
      createdAt: now,
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'preapprovals', cleanId), record);

        // If a pending user already exists with this email, approve them right away
        const existingPending = usersList.find(
          (u) => u.email.toLowerCase() === cleanEmail && u.status === 'pending'
        );
        if (existingPending) {
          await approveUser(existingPending.uid, role);
        }
      } catch (err) {
        console.error('Failed to save preapproval:', err);
        handleFirestoreError(err, OperationType.WRITE, `preapprovals/${cleanId}`);
      }
    }

    setPreapprovedList((prev) => [...prev.filter((p) => p.email !== cleanEmail), record]);

    await logAudit({
      action: 'preapprove_email',
      actionLabel: 'Pendaftaran Pra-Verifikasi Email',
      targetId: cleanId,
      targetType: 'auth',
      summary: `Menambahkan email pra-verifikasi ${cleanEmail} dengan peran ${role.toUpperCase()}`,
      details: {
        targetUserEmail: cleanEmail,
      },
    });
  };

  const removePreapproval = async (id: string) => {
    if (!isSuperAdmin) {
      throw new Error('Hanya Superadmin yang dapat menghapus daftar pra-verifikasi');
    }

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'preapprovals', id));
      } catch (err) {
        console.error('Failed to delete preapproval:', err);
      }
    }

    setPreapprovedList((prev) => prev.filter((p) => p.id !== id));
  };

  const value: CashflowContextType = {
    transactions,
    filteredTransactions,
    categories,
    projects,
    usersList,
    preapprovedList,
    auditLogs,
    loading,
    filters,
    setFilters,
    resetFilters,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addProject,
    updateProject,
    deleteProject,
    addCategory,
    updateCategory,
    deleteCategory,
    syncOfficialCategories,
    updateUserRole,
    approveUser,
    rejectUser,
    deleteUserAccount,
    preapproveEmail,
    removePreapproval,
  };

  return <CashflowContext.Provider value={value}>{children}</CashflowContext.Provider>;
};

export const useCashflow = () => {
  const context = useContext(CashflowContext);
  if (!context) {
    throw new Error('useCashflow must be used within a CashflowProvider');
  }
  return context;
};
