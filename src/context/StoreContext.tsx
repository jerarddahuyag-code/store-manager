import React, { createContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuth from '../hooks/useAuth';
import { uploadToCloudinary } from '../services/cloudinary';
import { logActivity } from '../services/activityLogs';
import type { Store } from '../types';

interface StoreContextType {
  stores: Store[];
  activeStore: Store | null;
  activeStoreId: string;
  setActiveStoreId: (storeId: string) => void;
  loading: boolean;
  createStore: (
    data: { name: string; description?: string },
    bannerFile?: File | null,
    logoFile?: File | null
  ) => Promise<string>;
  updateStore: (
    storeId: string,
    data: { name?: string; description?: string },
    bannerFile?: File | null,
    logoFile?: File | null
  ) => Promise<void>;
  archiveStore: (storeId: string) => Promise<void>;
}

export const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const ACTIVE_STORE_STORAGE_KEY = 'store_manager_active_store_id';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_STORE_STORAGE_KEY) || '';
  });
  const [loading, setLoading] = useState(true);

  // Subscribe to non-archived stores
  useEffect(() => {
    if (!currentUser) {
      setStores([]);
      setLoading(false);
      return;
    }

    const storesRef = collection(db, 'stores');

    const unsubscribe = onSnapshot(
      storesRef,
      (snapshot) => {
        const loadedStores: Store[] = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Store, 'id'>),
          }))
          .filter((s) => !s.isArchived);

        setStores(loadedStores);

        // Keep activeStoreId in sync with available stores
        setActiveStoreIdState((prevActiveId) => {
          if (loadedStores.length === 0) {
            localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
            return '';
          }
          const exists = loadedStores.some((s) => s.id === prevActiveId);
          if (!exists) {
            const fallbackId = loadedStores[0].id;
            localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, fallbackId);
            return fallbackId;
          }
          return prevActiveId;
        });

        setLoading(false);
      },
      (error) => {
        console.error('Error fetching stores:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const setActiveStoreId = (id: string) => {
    setActiveStoreIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
    }
  };

  const activeStore = stores.find((s) => s.id === activeStoreId) || null;

  const createStore = async (
    data: { name: string; description?: string },
    bannerFile?: File | null,
    logoFile?: File | null
  ): Promise<string> => {
    if (!currentUser) throw new Error('You must be signed in to create a store');

    let bannerUrl = '';
    let logoUrl = '';

    if (bannerFile) {
      bannerUrl = await uploadToCloudinary(bannerFile);
    }
    if (logoFile) {
      logoUrl = await uploadToCloudinary(logoFile);
    }

    const performer = {
      uid: currentUser.uid,
      fullName: userProfile?.fullName || currentUser.displayName || currentUser.email || 'Family Member',
    };

    const newStoreData = {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      bannerUrl,
      logoUrl,
      currency: 'PHP',
      isArchived: false,
      createdAt: serverTimestamp(),
      createdBy: performer,
    };

    const docRef = await addDoc(collection(db, 'stores'), newStoreData);
    const newId = docRef.id;

    await logActivity({
      storeId: newId,
      entityType: 'store',
      entityId: newId,
      action: 'created',
      summary: `${performer.fullName} created store "${data.name.trim()}"`,
      performedBy: performer,
    });

    setActiveStoreId(newId);
    return newId;
  };

  const updateStore = async (
    storeId: string,
    data: { name?: string; description?: string },
    bannerFile?: File | null,
    logoFile?: File | null
  ): Promise<void> => {
    if (!currentUser) throw new Error('You must be signed in to update a store');

    const performer = {
      uid: currentUser.uid,
      fullName: userProfile?.fullName || currentUser.displayName || currentUser.email || 'Family Member',
    };

    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.description !== undefined) updates.description = data.description.trim();

    if (bannerFile) {
      updates.bannerUrl = await uploadToCloudinary(bannerFile);
    }
    if (logoFile) {
      updates.logoUrl = await uploadToCloudinary(logoFile);
    }

    await updateDoc(doc(db, 'stores', storeId), updates);

    await logActivity({
      storeId,
      entityType: 'store',
      entityId: storeId,
      action: 'updated',
      summary: `${performer.fullName} updated store details`,
      performedBy: performer,
    });
  };

  const archiveStore = async (storeId: string): Promise<void> => {
    if (!currentUser) throw new Error('You must be signed in to archive a store');

    const performer = {
      uid: currentUser.uid,
      fullName: userProfile?.fullName || currentUser.displayName || currentUser.email || 'Family Member',
    };

    await updateDoc(doc(db, 'stores', storeId), {
      isArchived: true,
      archivedAt: serverTimestamp(),
    });

    await logActivity({
      storeId,
      entityType: 'store',
      entityId: storeId,
      action: 'archived',
      summary: `${performer.fullName} archived this store`,
      performedBy: performer,
    });
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        activeStoreId,
        setActiveStoreId,
        loading,
        createStore,
        updateStore,
        archiveStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}