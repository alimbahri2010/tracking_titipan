import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { UserProfile, UserRole, UserStatus, LoginRoleOption } from '../types';

interface AuthContextType {
  currentUser: User | UserProfile | null;
  userProfile: UserProfile | null;
  role: UserRole;
  userStatus: UserStatus;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isConsumer: boolean;
  isApproved: boolean;
  isPendingApproval: boolean;
  isRejected: boolean;
  loading: boolean;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
  signIn: () => Promise<void>;
  signInWithEmailUser: (email: string, pass: string, roleOption?: LoginRoleOption) => Promise<void>;
  registerWithEmailUser: (email: string, pass: string, name?: string, roleOption?: LoginRoleOption) => Promise<void>;
  signInAsConsumer: (identifier?: string) => void;
  signInAsDemo: (role: UserRole | 'pending') => void;
  signOut: () => Promise<void>;
  simulateRole: (newRole: UserRole | null) => void;
  checkApprovalStatus: () => Promise<void>;
  activeRole: UserRole;
  roleOption: LoginRoleOption;
  setRoleOption: (opt: LoginRoleOption) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary initial Superadmin email from user metadata
const BOOTSTRAP_SUPERADMIN_EMAIL = 'alimbahri2010@gmail.com';
const DEMO_STORAGE_KEY = 'titipan_demo_session';
const ROLE_OPTION_STORAGE_KEY = 'titipan_preferred_role_option';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [roleOption, setRoleOptionState] = useState<LoginRoleOption>('tracking');

  const setRoleOption = (opt: LoginRoleOption) => {
    setRoleOptionState(opt);
    try {
      localStorage.setItem(ROLE_OPTION_STORAGE_KEY, opt);
    } catch {
      // ignore
    }
  };

  // Ensure any past instant demo session is cleared
  useEffect(() => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      const saved = localStorage.getItem(ROLE_OPTION_STORAGE_KEY) as LoginRoleOption;
      if (saved === 'tracking' || saved === 'admin') {
        setRoleOptionState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        // Clear demo session if real Firebase user exists
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setCurrentUser(user);

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          let currentRole: UserRole = 'admin';
          let currentStatus: UserStatus = 'pending';

          const isSuperAdminEmail =
            user.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL.toLowerCase();

          if (isSuperAdminEmail) {
            currentRole = 'superadmin';
            currentStatus = 'approved';
          } else if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            currentRole = data.role || 'admin';
            currentStatus = data.status || 'approved'; // Preserve existing accounts as approved
          } else {
            const savedRoleOption = (localStorage.getItem(ROLE_OPTION_STORAGE_KEY) as LoginRoleOption) || roleOption;
            if (savedRoleOption === 'tracking') {
              currentRole = 'consumer';
              currentStatus = 'approved';
            } else {
              // Check if this email is in preapprovals list
              const cleanEmailKey = (user.email || '').toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
              if (cleanEmailKey) {
                try {
                  const preDoc = await getDoc(doc(db, 'preapprovals', cleanEmailKey));
                  if (preDoc.exists()) {
                    currentStatus = 'approved';
                    currentRole = (preDoc.data().role as UserRole) || 'admin';
                  }
                } catch (preErr) {
                  console.warn('Check preapproval error:', preErr);
                }
              }
            }
          }

          const profileData: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Titipan',
            photoURL: user.photoURL || '',
            role: currentRole,
            status: currentStatus,
            lastLoginAt: new Date().toISOString(),
          };

          if (!userDocSnap.exists()) {
            profileData.createdAt = new Date().toISOString();
          } else {
            const existing = userDocSnap.data();
            if (existing.approvedBy) profileData.approvedBy = existing.approvedBy;
            if (existing.approvedAt) profileData.approvedAt = existing.approvedAt;
            if (existing.rejectedReason) profileData.rejectedReason = existing.rejectedReason;
          }

          // Save / update user profile in Firestore
          await setDoc(userDocRef, profileData, { merge: true });

          // If superadmin, ensure entry in /admins collection
          if (currentRole === 'superadmin') {
            await setDoc(
              doc(db, 'admins', user.uid),
              {
                uid: user.uid,
                email: user.email,
                role: 'superadmin',
                assignedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }

          setUserProfile(profileData);

          // Real-time listener for user profile updates (e.g. approval by Superadmin)
          profileUnsub = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                const updated = snap.data() as UserProfile;
                setUserProfile((prev) => ({
                  ...(prev || profileData),
                  ...updated,
                }));
              }
            },
            (err) => {
              console.warn('Real-time profile listener error:', err);
            }
          );
        } catch (err) {
          console.error('Error fetching/setting user profile:', err);
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        // If no real user, check if we had demo user
        const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo) as UserProfile;
            setCurrentUser(parsed);
            setUserProfile(parsed);
          } catch {
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const checkApprovalStatus = async () => {
    if (!currentUser?.uid) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile((prev) => (prev ? { ...prev, ...data } : data));
      }
    } catch (err) {
      console.warn('Check approval status error:', err);
    }
  };

  const signIn = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Failed to sign in with Google', error);
      const code = error?.code || 'auth/unknown';
      setAuthErrorCode(code);

      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          'Domain aplikasi ini belum didaftarkan di Firebase Console (Authorized Domains). Silakan tambahkan domain ke Firebase Authentication Settings.'
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Jendela pop-up Google Sign-In diblokir oleh browser atau izin iframe. Izinkan pop-up di browser Anda.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Proses login dibatalkan karena jendela login ditutup.');
      } else {
        setAuthError(error.message || 'Gagal login dengan Google. Periksa koneksi atau izin.');
      }
      throw error;
    }
  };

  const signInWithEmailUser = async (email: string, pass: string, targetRole: LoginRoleOption = roleOption) => {
    setAuthError(null);
    setAuthErrorCode(null);
    setRoleOption(targetRole);

    try {
      await loginWithEmail(email.trim(), pass);
    } catch (error: any) {
      console.error('Email login failed:', error);
      const code = error?.code || 'auth/unknown';
      setAuthErrorCode(code);

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError('Email atau password tidak sesuai. Silakan periksa kembali.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Format email tidak valid.');
      } else if (code === 'auth/operation-not-allowed') {
        if (targetRole === 'tracking') {
          signInAsConsumer(email);
          return;
        }
        setAuthError('Login email/password belum diaktifkan di Firebase Console. Gunakan "Login dengan Google".');
      } else {
        setAuthError(error.message || 'Gagal masuk akun.');
      }
      throw error;
    }
  };

  const registerWithEmailUser = async (
    email: string,
    pass: string,
    displayName?: string,
    targetRole: LoginRoleOption = roleOption
  ) => {
    setAuthError(null);
    setAuthErrorCode(null);
    setRoleOption(targetRole);

    try {
      await registerWithEmail(email.trim(), pass);
    } catch (error: any) {
      console.error('Email registration failed:', error);
      const code = error?.code || 'auth/unknown';
      setAuthErrorCode(code);

      if (code === 'auth/email-already-in-use') {
        setAuthError('Email ini sudah terdaftar. Silakan langsung login.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password minimal harus 6 karakter.');
      } else if (code === 'auth/operation-not-allowed') {
        if (targetRole === 'tracking') {
          signInAsConsumer(displayName || email);
          return;
        }
        setAuthError('Metode registrasi email belum diaktifkan di Firebase Console.');
      } else {
        setAuthError(error.message || 'Gagal mendaftar akun.');
      }
      throw error;
    }
  };

  const signInAsConsumer = (identifier?: string) => {
    const isEmail = Boolean(identifier && identifier.includes('@'));
    const consumerEmail = isEmail ? identifier! : `${(identifier || 'konsumen').replace(/\s+/g, '').toLowerCase()}@tracking.titipan.com`;
    const consumerName = isEmail ? identifier!.split('@')[0] : (identifier || 'Konsumen Titipan');

    const profile: UserProfile = {
      uid: `consumer_${Date.now()}`,
      email: consumerEmail,
      displayName: consumerName,
      role: 'consumer',
      status: 'approved',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(profile);
    setUserProfile(profile);
    setRoleOption('tracking');
    setAuthError(null);
    setAuthErrorCode(null);
  };

  const signInAsDemo = (role: UserRole | 'pending') => {
    // Legacy stub
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
      setSimulatedRole(null);
    } catch (error) {
      console.error('Failed to log out', error);
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorCode(null);
  };

  const simulateRole = (newRole: UserRole | null) => {
    setSimulatedRole(newRole);
  };

  const isBootstrapSuper =
    currentUser?.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL.toLowerCase();

  const effectiveRole: UserRole =
    simulatedRole ||
    (isBootstrapSuper
      ? 'superadmin'
      : userProfile?.role || (roleOption === 'tracking' ? 'consumer' : 'admin'));

  const isConsumer = effectiveRole === 'consumer';

  const effectiveStatus: UserStatus = isBootstrapSuper || isConsumer
    ? 'approved'
    : userProfile?.status || 'approved';

  const isSuperAdmin = effectiveRole === 'superadmin';
  const isApproved = isConsumer || isSuperAdmin || effectiveStatus === 'approved';
  const isPendingApproval = !isConsumer && !isSuperAdmin && effectiveStatus === 'pending';
  const isRejected = !isConsumer && !isSuperAdmin && effectiveStatus === 'rejected';

  const value: AuthContextType = {
    currentUser,
    userProfile,
    role: effectiveRole,
    userStatus: effectiveStatus,
    activeRole: effectiveRole,
    isSuperAdmin,
    isAdmin: !isConsumer && isApproved && (effectiveRole === 'admin' || effectiveRole === 'superadmin'),
    isConsumer,
    isApproved,
    isPendingApproval,
    isRejected,
    loading,
    authError,
    authErrorCode,
    clearAuthError,
    signIn,
    signInWithEmailUser,
    registerWithEmailUser,
    signInAsConsumer,
    signInAsDemo,
    signOut,
    simulateRole,
    checkApprovalStatus,
    roleOption,
    setRoleOption,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
