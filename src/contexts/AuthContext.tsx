import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync active user to Firestore for real-time account tracking
  const syncUserToFirestore = async (u: User, name?: string) => {
    try {
      await setDoc(doc(db, 'registered_users', u.uid), {
        uid: u.uid,
        email: u.email || '',
        displayName: name || u.displayName || 'Pengguna Smart Play',
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("Could not sync user document to Firestore:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        syncUserToFirestore(currentUser);
      }
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await syncUserToFirestore(userCredential.user);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
        await updateProfile(userCredential.user, {
            displayName: name
        });
        await syncUserToFirestore(userCredential.user, name);
        // Force refresh user state untuk memastikan nama tampil
        setUser({ ...userCredential.user, displayName: name });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};