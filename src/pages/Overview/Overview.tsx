import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store as StoreIcon,
  Plus,
  Package,
  ShoppingBag,
  Coins,
  Settings,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import { Button } from '../../components/buttons/button';
import StoreCard from '../../components/StoreCard/StoreCard';
import ActivityTimeline from '../../components/ActivityLog/ActivityTimeline';
import { formatPHP } from '../../utils/formatters';
import type { Order } from '../../types';
import styles from './Overview.module.css';

export default function Overview() {
  const { stores, activeStore, activeStoreId, setActiveStoreId, loading: storesLoading } =
    useActiveStore();
  const navigate = useNavigate();

  const [productsCount, setProductsCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    if (!activeStoreId) {
      setProductsCount(0);
      setOrdersCount(0);
      setTotalRevenue(0);
      return;
    }

    // Subscribe to active store products
    const prodQ = query(
      collection(db, 'products'),
      where('storeId', '==', activeStoreId)
    );
    const unsubProd = onSnapshot(prodQ, (snap) => {
      const activeProducts = snap.docs.filter((d) => !d.data().isArchived);
      setProductsCount(activeProducts.length);
    });

    // Subscribe to active store orders
    const ordQ = query(collection(db, 'orders'), where('storeId', '==', activeStoreId));
    const unsubOrd = onSnapshot(ordQ, (snap) => {
      const orders = snap.docs.map((d) => d.data() as Order);
      setOrdersCount(orders.length);
      const revenue = orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setTotalRevenue(revenue);
    });

    return () => {
      unsubProd();
      unsubOrd();
    };
  }, [activeStoreId]);

  if (storesLoading) {
    return (
      <div className={styles.container}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Loading your stores...
        </div>
      </div>
    );
  }

  // First-run empty state
  if (stores.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <StoreIcon size={32} />
          </div>
          <h2 className={styles.emptyTitle}>Welcome to Store Manager</h2>
          <p className={styles.emptyText}>
            You don't have any family stores set up yet. Create your first store to start managing products, inventory, and delivery orders.
          </p>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus size={18} />}
            onClick={() => navigate('/stores/new')}
          >
            Create Your First Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      {activeStore && (
        <div className={styles.hero}>
          <div className={styles.heroBanner}>
            {activeStore.bannerUrl && (
              <img src={activeStore.bannerUrl} alt="" className={styles.heroBannerImage} />
            )}
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroStoreInfo}>
              <div className={styles.heroLogo}>
                {activeStore.logoUrl ? (
                  <img src={activeStore.logoUrl} alt="" className={styles.heroLogoImage} />
                ) : (
                  <StoreIcon size={32} />
                )}
              </div>
              <div className={styles.heroMeta}>
                <h1 className={styles.heroTitle}>{activeStore.name}</h1>
                {activeStore.description && (
                  <p className={styles.heroDesc}>{activeStore.description}</p>
                )}
              </div>
            </div>

            <Button
              className={styles.heroSettingsBtn}
              variant="secondary"
              size="sm"
              leftIcon={<Settings size={14} />}
              onClick={() => navigate(`/stores/${activeStore.id}/edit`)}
            >
              Store Settings
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            <Package size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Active Products</span>
            <span className={styles.metricValue}>{productsCount}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#ECFDF5', color: '#059669' }}>
            <ShoppingBag size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Total Orders</span>
            <span className={styles.metricValue}>{ordersCount}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: '#FFFBEB', color: '#D97706' }}>
            <Coins size={24} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Sales Volume (PHP)</span>
            <span className={styles.metricValue}>{formatPHP(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Stores Switcher Section */}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Family Stores</h2>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => navigate('/stores/new')}
          >
            Add Store
          </Button>
        </div>

        <div className={styles.storesGrid}>
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isActive={store.id === activeStoreId}
              onSelect={() => setActiveStoreId(store.id)}
            />
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {activeStoreId && (
        <ActivityTimeline entityType="store" entityId={activeStoreId} limitCount={5} />
      )}
    </div>
  );
}