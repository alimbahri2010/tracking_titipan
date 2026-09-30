export type UserRole = 'superadmin' | 'admin' | 'consumer';
export type LoginRoleOption = 'tracking' | 'admin';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface PreapprovedEmail {
  id: string;
  email: string;
  role: UserRole;
  addedBy: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryGroup?: string;
  categoryColor?: string;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: string;
  referenceNumber?: string;
  createdByUid: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
  group?: string;
  isDefault?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DateFilterPreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  datePreset: DateFilterPreset;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  userUid: string;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthNet: number;
  totalTransactionsCount: number;
}

export type AuditActionType =
  | 'create_transaction'
  | 'update_transaction'
  | 'delete_transaction'
  | 'approve_user'
  | 'reject_user'
  | 'change_user_role'
  | 'preapprove_email';

export interface AuditLogChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: AuditActionType;
  actionLabel: string;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  targetId?: string;
  targetType: 'transaction' | 'user' | 'category' | 'auth';
  summary: string;
  details?: {
    transactionType?: TransactionType;
    amount?: number;
    categoryName?: string;
    description?: string;
    paymentMethod?: string;
    referenceNumber?: string;
    targetUserName?: string;
    targetUserEmail?: string;
    changes?: AuditLogChange[];
    metadata?: Record<string, any>;
  };
}

export type TrackingOrderStatus = 'Delivery' | 'Transit' | 'Pending' | 'Completed';

export interface TrackingActivityItem {
  id: string;
  location: string;
  time: string;
  completed: boolean;
  current?: boolean;
  note?: string;
}

export interface TrackingCustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerRole: string;
  customerEmail: string;
  customerPhone: string;
  customerAvatar?: string;
  originAddress: string;
  originCity: string;
  destinationAddress: string;
  destinationCity: string;
  status: TrackingOrderStatus;
  progressPercent: number;
  estimatedArrival: string;
  serviceType: string;
  totalAmount: number;
  driver: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar: string;
    plateNumber: string;
    truckType: string;
    currentSpeed?: string;
    remainingDistance?: string;
  };
  activities: TrackingActivityItem[];
  routeCoordinates?: {
    pickup: { lat: number; lng: number; label: string };
    dropoff: { lat: number; lng: number; label: string };
    currentPosition: { lat: number; lng: number };
  };
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

