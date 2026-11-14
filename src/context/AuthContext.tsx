/**
 * CareBridge Authentication Context
 * Production Firebase Authentication with Firestore profile sync,
 * session persistence, email verification, and role-based access control.
 */

import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { dataStore } from '../services/dataService';
import type { UserProfile, UserRole } from '../types';

const DIRECTORY_ROLES: UserRole[] = ['hospital', 'bloodBank', 'oxygenProvider', 'ambulanceProvider', 'doctor'];

const syncProviderDirectory = async (profile: UserProfile) => {
  if (!isFirebaseConfigured || !db || !DIRECTORY_ROLES.includes(profile.role)) return;

  await setDoc(
    doc(db, 'providerDirectory', profile.uid),
    {
      uid: profile.uid,
      role: profile.role,
      displayName: profile.displayName,
      city: profile.city,
      hospitalAffiliation: profile.hospitalAffiliation || '',
      isVerified: profile.isVerified,
      isActive: profile.isActive,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
};

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (params: {
    email: string;
    pass: string;
    displayName: string;
    role: Exclude<UserRole, 'admin'>; // Security: Never allow public registration as admin
    phone?: string;
    city?: string;
    hospitalAffiliation?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInferredRole = (email?: string, defaultRole: UserRole = 'patient'): UserRole => {
  const emailLower = (email || '').toLowerCase();
  if (emailLower.includes('bloodbank') || emailLower.includes('blood')) return 'bloodBank';
  if (emailLower.includes('oxygen')) return 'oxygenProvider';
  if (emailLower.includes('hospital')) return 'hospital';
  if (emailLower.includes('ambulance')) return 'ambulanceProvider';
  if (emailLower.includes('doctor')) return 'doctor';
  if (emailLower.includes('admin')) return 'admin';
  if (emailLower === 'sahana2006@gmail.com') return 'patientAttendant';
  return defaultRole;
};

const getStoredRole = (uid: string): UserRole | null => {
  try {
    return (localStorage.getItem(`carebridge_user_role_${uid}`) as UserRole) || null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pendingSignupRoleRef = useRef<{ role: UserRole; displayName: string; phone?: string; hospitalAffiliation?: string } | null>(null);

  // Sync Firebase Auth state on mount and reload
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Fetch user profile from Firestore users collection
          let userProfile: UserProfile | null = null;
          const pendingRole = pendingSignupRoleRef.current?.role || (localStorage.getItem('carebridge_pending_role') as UserRole) || null;
          const storedRole = getStoredRole(fbUser.uid);

          if (isFirebaseConfigured && db) {
            try {
              const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
              if (userSnap.exists()) {
                userProfile = userSnap.data() as UserProfile;
              }
            } catch (err) {
              console.warn('[CareBridge Auth] Firestore fetch note:', err);
            }
          }

          // If not in Firestore or offline, check local store
          if (!userProfile) {
            userProfile = dataStore.getUser(fbUser.uid) || null;
          }

          const targetRole = pendingRole || storedRole || getInferredRole(fbUser.email || '', userProfile?.role || 'patient');

          // If new authenticated user without existing document, initialize profile
          if (!userProfile) {
            userProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: pendingSignupRoleRef.current?.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'CareBridge User',
              role: targetRole,
              phone: pendingSignupRoleRef.current?.phone || '',
              city: 'Hubballi',
              state: 'Karnataka',
              isVerified: !DIRECTORY_ROLES.includes(targetRole),
              isActive: true,
              profileComplete: true,
              hospitalAffiliation: pendingSignupRoleRef.current?.hospitalAffiliation,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            if (isFirebaseConfigured && db) {
              try {
                await setDoc(doc(db, 'users', fbUser.uid), userProfile);
              } catch (err) {
                console.warn('[CareBridge Auth] Firestore profile create note:', err);
              }
            }
            dataStore.saveUser(userProfile);
          } else {
            // Apply role overrides if user previously selected or inferred from role email
            const activeOverride = storedRole || pendingRole || getInferredRole(userProfile.email, userProfile.role);
            if (activeOverride && userProfile.role !== activeOverride) {
              userProfile.role = activeOverride;
              dataStore.saveUser(userProfile);
            }
          }

          if (userProfile && isFirebaseConfigured && db) {
            try {
              await syncProviderDirectory(userProfile);
            } catch (directoryError) {
              console.error('[CareBridge Auth] Provider directory sync failed:', directoryError);
            }
          }
          setCurrentUser(userProfile);
        } catch (e: any) {
          console.error('[CareBridge Auth] Error resolving user profile:', e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, rememberMe = true): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured && auth) {
        // Set session persistence based on user preference
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );

        const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
        setFirebaseUser(cred.user);

        // Fetch user doc from Firestore
        let profile: UserProfile | null = null;
        if (db) {
          const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
          if (userSnap.exists()) {
            profile = userSnap.data() as UserProfile;
          }
        }

        if (!profile) {
          profile = dataStore.getUser(cred.user.uid) || {
            uid: cred.user.uid,
            email: cred.user.email || email,
            displayName: cred.user.displayName || email.split('@')[0],
            role: 'patient',
            city: 'Hubballi',
            state: 'Karnataka',
            isVerified: true,
            isActive: true,
            profileComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          if (db) {
            await setDoc(doc(db, 'users', cred.user.uid), profile);
          }
          dataStore.saveUser(profile);
        }

        if (profile) {
          const stored = getStoredRole(cred.user.uid);
          if (stored) {
            profile.role = stored;
          } else {
            profile.role = getInferredRole(profile.email, profile.role);
          }
          dataStore.saveUser(profile);
        }

        if (!profile.isActive) {
          setError('This account has been suspended by the administrator.');
          await signOut(auth);
          setCurrentUser(null);
          return false;
        }

        try {
          await syncProviderDirectory(profile);
        } catch (directoryError) {
          console.error('[CareBridge Auth] Provider directory sync failed:', directoryError);
        }
        setCurrentUser(profile);
        return true;
      }

      // Fallback for development if credentials are empty
      const matched = dataStore.getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matched) {
        if (!matched.isActive) {
          setError('This account has been suspended by administrator.');
          return false;
        }
        setCurrentUser(matched);
        return true;
      }

      setError('Invalid credentials. Please verify your email and password.');
      return false;
    } catch (err: any) {
      console.error('[CareBridge Auth] Login error:', err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This user account has been disabled.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (params: {
    email: string;
    pass: string;
    displayName: string;
    role: Exclude<UserRole, 'admin'>;
    phone?: string;
    city?: string;
    hospitalAffiliation?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      // Security check: strictly block admin role selection on public signup
      if ((params.role as string) === 'admin') {
        throw new Error('Administrative accounts cannot be registered publicly.');
      }

      pendingSignupRoleRef.current = {
        role: params.role,
        displayName: params.displayName,
        phone: params.phone,
        hospitalAffiliation: params.hospitalAffiliation
      };
      try {
        localStorage.setItem('carebridge_pending_role', params.role);
      } catch (e) { }

      let uid = 'user-' + Date.now().toString().slice(-6);

      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.pass);
        uid = cred.user.uid;
        setFirebaseUser(cred.user);

        // Update display name in Firebase Auth
        try {
          await updateFirebaseProfile(cred.user, { displayName: params.displayName.trim() });
        } catch (e) { }

        // Send Email Verification
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('[CareBridge Auth] Email verification note:', e);
        }
      }

      const isHealthcareProvider = DIRECTORY_ROLES.includes(params.role);

      const newProfile: UserProfile = {
        uid,
        email: params.email.trim(),
        displayName: params.displayName.trim(),
        role: params.role,
        phone: params.phone?.trim() || '',
        city: params.city?.trim() || 'Hubballi',
        state: 'Karnataka',
        // Providers require administrator verification before live dispatch
        isVerified: !isHealthcareProvider,
        isActive: true,
        profileComplete: true,
        hospitalAffiliation: params.hospitalAffiliation?.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Write to Firestore users collection
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'users', uid), newProfile);

          // Initialize provider profile if applicable
          if (params.role === 'hospital') {
            await setDoc(doc(db, 'hospitalProfiles', uid), {
              uid,
              hospitalName: params.displayName.trim(),
              registrationNumber: 'REG-' + Date.now().toString().slice(-6),
              departments: ['Emergency Trauma', 'General Medicine'],
              totalBeds: 50,
              availableBeds: 20,
              totalICU: 10,
              availableICU: 2,
              totalVentilators: 5,
              availableVentilators: 1,
              contactNumber: params.phone?.trim() || '+91 800 000 0000',
              operatingHours: '24/7',
              city: params.city?.trim() || 'Hubballi',
              state: 'Karnataka',
              address: 'Medical Facility Address',
              isVerified: false,
              lastUpdated: new Date().toISOString()
            });
          }
          await syncProviderDirectory(newProfile);
        } catch (err) {
          console.error('[CareBridge Auth] Firestore profile write failed:', err);
          throw err;
        }
      }

      try {
        localStorage.setItem(`carebridge_user_role_${uid}`, params.role);
        localStorage.removeItem('carebridge_pending_role');
      } catch (e) { }

      dataStore.saveUser(newProfile);
      setCurrentUser(newProfile);
      return { success: true };
    } catch (err: any) {
      console.error('[CareBridge Auth] Signup error:', err);
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email.trim()) {
        return { success: false, error: 'Please enter your registered email address.' };
      }
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, email.trim());
        return { success: true };
      }
      // Demo simulated reset
      return { success: true };
    } catch (err: any) {
      console.error('[CareBridge Auth] Password reset error:', err);
      let msg = 'Failed to send reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      try {
        localStorage.removeItem('carebridge_cases_list');
        localStorage.removeItem('carebridge_active_case');
        localStorage.removeItem('carebridge_pending_role');
        if (currentUser?.uid) {
          localStorage.removeItem(`carebridge_cases_list_${currentUser.uid}`);
          localStorage.removeItem(`carebridge_active_case_${currentUser.uid}`);
        }
      } catch (e) { }
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (e) {
      console.error('[CareBridge Auth] Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setCurrentUser(updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
        await syncProviderDirectory(updated);
      } catch (e) {
        console.error('[CareBridge Auth] Profile update failed:', e);
      }
    }
    dataStore.saveUser(updated);
  };

  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      role: newRole,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(`carebridge_user_role_${currentUser.uid}`, newRole);
    } catch (e) { }
    dataStore.saveUser(updated);
    setCurrentUser(updated);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'users', currentUser.uid), { role: newRole, updatedAt: updated.updatedAt }, { merge: true }).catch((err) => {
        console.warn('[CareBridge Auth] switchRole Firestore update:', err);
      });
      syncProviderDirectory(updated).catch(() => { });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        activeRole: currentUser?.role || null,
        isAuthenticated: Boolean(currentUser),
        loading,
        error,
        login,
        signup,
        resetPassword,
        logout,
        updateProfile,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const defaultAuthContext: AuthContextType = {
  currentUser: null,
  firebaseUser: null,
  activeRole: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: async () => false,
  signup: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  resetPassword: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  logout: async () => { },
  updateProfile: async () => { },
  switchRole: () => { },
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return defaultAuthContext;
  }
  return ctx;
};
