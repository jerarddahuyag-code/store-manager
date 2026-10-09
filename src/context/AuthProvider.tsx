import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  completeOnboarding: (fullName: string, avatarFile?: File | null) => Promise<void>;
  updateUserProfileData: (fullName: string, avatarFile?: File | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            setNeedsOnboarding(!data.fullName || data.fullName.trim() === '');
          } else {
            // Document doesn't exist yet, check if displayName is present
            if (user.displayName && user.displayName.trim() !== '') {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                fullName: user.displayName,
                avatarUrl: user.photoURL || undefined,
              };
              await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp() });
              setUserProfile(newProfile);
              setNeedsOnboarding(false);
            } else {
              setUserProfile(null);
              setNeedsOnboarding(true);
            }
          }
        } catch (error) {
          console.error('Failed to load user profile from Firestore:', error);
          if (user.displayName) {
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName,
              avatarUrl: user.photoURL || undefined,
            });
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        }
      } else {
        setUserProfile(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const completeOnboarding = async (fullName: string, avatarFile?: File | null) => {
    if (!currentUser) throw new Error('No authenticated user found');

    let avatarUrl = currentUser.photoURL || '';
    if (avatarFile) {
      avatarUrl = await uploadToCloudinary(avatarFile);
    }

    await updateProfile(currentUser, {
      displayName: fullName,
      photoURL: avatarUrl || null,
    });

    const userDocRef = doc(db, 'users', currentUser.uid);
    const profileData: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      fullName,
      avatarUrl: avatarUrl || undefined,
    };

    await setDoc(userDocRef, {
      ...profileData,
      createdAt: serverTimestamp(),
    });

    setUserProfile(profileData);
    setNeedsOnboarding(false);
  };

  const updateUserProfileData = async (fullName: string, avatarFile?: File | null) => {
    if (!currentUser) throw new Error('No authenticated user found');

    let avatarUrl = userProfile?.avatarUrl || currentUser.photoURL || '';
    if (avatarFile) {
      avatarUrl = await uploadToCloudinary(avatarFile);
    }

    await updateProfile(currentUser, {
      displayName: fullName,
      photoURL: avatarUrl || null,
    });

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updated: Partial<UserProfile> = {
      fullName,
      avatarUrl: avatarUrl || undefined,
    };

    await setDoc(userDocRef, updated, { merge: true });

    setUserProfile((prev) =>
      prev ? { ...prev, fullName, avatarUrl: avatarUrl || undefined } : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        needsOnboarding,
        completeOnboarding,
        updateUserProfileData,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}