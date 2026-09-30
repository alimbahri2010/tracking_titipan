import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { UserProfile, UserRole, UserStatus, LoginRoleOption } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
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
  needsEmailConfirmation: boolean;
  passwordResetSent: boolean;
  passwordUpdated: boolean;
  clearAuthError: () => void;
  signIn: () => Promise<void>;
  signInWithEmailUser: (email: string, pass: string, roleOption?: LoginRoleOption) => Promise<void>;
  registerWithEmailUser: (email: string, pass: string, name?: string, roleOption?: LoginRoleOption) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
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
const ROLE_OPTION_STORAGE_KEY = 'titipan_preferred_role_option';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState<boolean>(false);
  const [passwordResetSent, setPasswordResetSent] = useState<boolean>(false);
  const [passwordUpdated, setPasswordUpdated] = useState<boolean>(false);
  const [roleOption, setRoleOptionState] = useState<LoginRoleOption>('admin');

  const setRoleOption = (opt: LoginRoleOption) => {
    setRoleOptionState(opt);
    try {
      localStorage.setItem(ROLE_OPTION_STORAGE_KEY, opt);
    } catch {
      // ignore
    }
  };

  const mapSupabaseUser = (user: any): UserProfile => {
    const isSuperAdminEmail =
      user.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL.toLowerCase();
    const userRole: UserRole = isSuperAdminEmail
      ? 'superadmin'
      : (user.user_metadata?.role as UserRole) || 'admin';

    const displayName =
      user.user_metadata?.name ||
      user.user_metadata?.displayName ||
      user.email?.split('@')[0] ||
      'Pengguna Titipan';

    return {
      uid: user.id,
      email: user.email || '',
      displayName,
      photoURL: user.user_metadata?.avatar_url || '',
      role: userRole,
      status: 'approved',
      createdAt: user.created_at || new Date().toISOString(),
      lastLoginAt: user.last_sign_in_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    let isMounted = true;

    try {
      const saved = localStorage.getItem(ROLE_OPTION_STORAGE_KEY) as LoginRoleOption;
      if (saved === 'tracking' || saved === 'admin') {
        setRoleOptionState(saved);
      }
    } catch {
      // ignore
    }

    // 1. Initial Session Check from Supabase Auth
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        }
        if (session?.user) {
          const profile = mapSupabaseUser(session.user);
          setCurrentUser(profile);
          setUserProfile(profile);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to retrieve session:', err);
        setLoading(false);
      });

    // 2. Auth State Change Listener (Restores session, handles login/logout/recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const profile = mapSupabaseUser(session.user);
          setCurrentUser(profile);
          setUserProfile(profile);
          setNeedsEmailConfirmation(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUserProfile(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        if (session?.user) {
          const profile = mapSupabaseUser(session.user);
          setCurrentUser(profile);
          setUserProfile(profile);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorCode(null);
  };

  const signInWithEmailUser = async (
    email: string,
    pass: string,
    targetRole: LoginRoleOption = roleOption
  ) => {
    clearAuthError();
    setRoleOption(targetRole);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setAuthErrorCode(error.status ? String(error.status) : 'auth_error');
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Email atau password tidak sesuai. Silakan periksa kembali.');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Email Anda belum dikonfirmasi. Silakan periksa kotak masuk email Anda.');
        } else {
          setAuthError(error.message || 'Gagal masuk akun.');
        }
        throw error;
      }

      if (data.user) {
        const profile = mapSupabaseUser(data.user);
        setCurrentUser(profile);
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Supabase signInWithPassword error:', err);
      throw err;
    }
  };

  const registerWithEmailUser = async (
    email: string,
    pass: string,
    displayName?: string,
    targetRole: LoginRoleOption = roleOption
  ) => {
    clearAuthError();
    setRoleOption(targetRole);
    setNeedsEmailConfirmation(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            name: displayName?.trim() || email.split('@')[0],
            role: 'admin',
          },
        },
      });

      if (error) {
        setAuthErrorCode(error.status ? String(error.status) : 'signup_error');
        if (error.message.includes('User already registered')) {
          setAuthError('Email ini sudah terdaftar. Silakan langsung login.');
        } else if (error.message.includes('Password should be')) {
          setAuthError('Password minimal harus 6 karakter.');
        } else {
          setAuthError(error.message || 'Gagal mendaftar akun.');
        }
        throw error;
      }

      // Check if email confirmation is required by Supabase settings
      if (data.user && !data.session) {
        setNeedsEmailConfirmation(true);
      } else if (data.user && data.session) {
        const profile = mapSupabaseUser(data.user);
        setCurrentUser(profile);
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Supabase signUp error:', err);
      throw err;
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    clearAuthError();
    setPasswordResetSent(false);

    try {
      const redirectUrl = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setAuthError(error.message || 'Gagal mengirim email reset password.');
        throw error;
      }

      setPasswordResetSent(true);
    } catch (err: any) {
      console.error('Supabase resetPassword error:', err);
      throw err;
    }
  };

  const updateUserPassword = async (password: string) => {
    clearAuthError();
    setPasswordUpdated(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setAuthError(error.message || 'Gagal memperbarui kata sandi.');
        throw error;
      }

      setPasswordUpdated(true);
    } catch (err: any) {
      console.error('Supabase updateUser password error:', err);
      throw err;
    }
  };

  const signInAsConsumer = (identifier?: string) => {
    const isEmail = Boolean(identifier && identifier.includes('@'));
    const consumerEmail = isEmail
      ? identifier!
      : `${(identifier || 'konsumen').replace(/\s+/g, '').toLowerCase()}@tracking.titipan.com`;
    const consumerName = isEmail
      ? identifier!.split('@')[0]
      : identifier || 'Konsumen Titipan';

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
    clearAuthError();
  };

  const signIn = async () => {
    // Fallback stub for Google login redirect if requested
    setAuthError('Silakan gunakan email dan password untuk masuk ke sistem.');
  };

  const signInAsDemo = () => {
    // Legacy stub
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase signOut warning:', error);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setSimulatedRole(null);
    }
  };

  const simulateRole = (newRole: UserRole | null) => {
    setSimulatedRole(newRole);
  };

  const checkApprovalStatus = async () => {
    // In Supabase, authenticated users with confirmed email are approved
  };

  const isBootstrapSuper =
    currentUser?.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL.toLowerCase();

  const effectiveRole: UserRole =
    simulatedRole ||
    (isBootstrapSuper
      ? 'superadmin'
      : userProfile?.role || (roleOption === 'tracking' ? 'consumer' : 'admin'));

  const isConsumer = effectiveRole === 'consumer';
  const effectiveStatus: UserStatus = 'approved';

  const isSuperAdmin = effectiveRole === 'superadmin';
  const isApproved = isConsumer || isSuperAdmin || effectiveStatus === 'approved';
  const isPendingApproval = false;
  const isRejected = false;

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
    needsEmailConfirmation,
    passwordResetSent,
    passwordUpdated,
    clearAuthError,
    signIn,
    signInWithEmailUser,
    registerWithEmailUser,
    resetPasswordForEmail,
    updateUserPassword,
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
