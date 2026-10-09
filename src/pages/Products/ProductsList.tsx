import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Image as ImageIcon } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import { Button } from '../../components/buttons/button';
import { formatPHP } from '../../utils/formatters';
import type { Product, ProductStatus } from '../../types';
import styles from './Products.module.css';

export default function ProductsList() {
  const { activeStore, activeStoreId } = useActiveStore();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProductStatus>('All');

  useEffect(() => {
    if (!activeStoreId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'products'),
      where('storeId', '==', activeStoreId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Product[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Product, 'id'>),
          }))
          .filter((p) => !p.isArchived);
        setProducts(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load products:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeStoreId]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!activeStore) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
          Please create or select an active store to view products.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>
            Manage inventory and pricing for {activeStore.name}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => navigate('/products/new')}
        >
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className={styles.input}
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {(['All', 'Published', 'Draft'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: statusFilter === filter ? 'var(--color-primary)' : 'var(--color-border-default)',
                background: statusFilter === filter ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
                color: statusFilter === filter ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px dashed var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Package size={36} style={{ color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {searchQuery ? 'No products match your search' : 'No products in this store yet'}
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', maxWidth: '360px' }}>
            {searchQuery
              ? 'Try adjusting your search terms or filter.'
              : 'Add your first product with pricing and images to start recording sales.'}
          </p>
          {!searchQuery && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate('/products/new')}
            >
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Inventory</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const coverUrl = p.images && p.images.length > 0 ? p.images[0] : '';
                  const isOutOfStock = p.inventoryCount <= 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}/edit`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className={styles.productRowInfo}>
                          {coverUrl ? (
                            <img src={coverUrl} alt="" className={styles.productTableThumb} />
                          ) : (
                            <div
                              className={styles.productTableThumb}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                            >
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {p.name}
                            </div>
                            {p.description && (
                              <div
                                style={{
                                  fontSize: 'var(--font-size-xs)',
                                  color: 'var(--color-text-muted)',
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            p.status === 'Published' ? styles.statusPublished : styles.statusDraft
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: isOutOfStock ? 'var(--color-danger)' : 'var(--color-text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {p.inventoryCount} in stock
                        </span>
                        {isOutOfStock && (
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-danger)' }}>
                            Out of stock
                          </span>
                        )}
                      </td>

                      <td className={styles.tablePrice}>
                        {formatPHP(p.price)}
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.6875rem',
                              color: 'var(--color-text-muted)',
                              textDecoration: 'line-through',
                            }}
                          >
                            {formatPHP(p.compareAtPrice)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Products Card View */}
          <div className={styles.mobileCardsContainer}>
            {filteredProducts.map((p) => {
              const coverUrl = p.images && p.images.length > 0 ? p.images[0] : '';
              const isOutOfStock = p.inventoryCount <= 0;

              return (
                <div
                  key={`mobile-${p.id}`}
                  className={styles.mobileProductCard}
                  onClick={() => navigate(`/products/${p.id}/edit`)}
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt="" className={styles.mobileProductThumb} />
                  ) : (
                    <div className={styles.mobileProductThumb}>
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className={styles.mobileProductInfo}>
                    <div className={styles.mobileProductName}>{p.name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPHP(p.price)}
                    </div>
                    <div className={styles.mobileProductMeta}>
                      <span
                        className={`${styles.statusBadge} ${
                          p.status === 'Published' ? styles.statusPublished : styles.statusDraft
                        }`}
                      >
                        {p.status}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: isOutOfStock ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {isOutOfStock ? 'Out of stock' : `${p.inventoryCount} in stock`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
