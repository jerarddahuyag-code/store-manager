import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, ArrowLeft, Trash2 } from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import useAuth from '../../hooks/useAuth';
import { uploadToCloudinary } from '../../services/cloudinary';
import { logActivity } from '../../services/activityLogs';
import { Button } from '../../components/buttons/button';
import ActivityTimeline from '../../components/ActivityLog/ActivityTimeline';
import type { Product, ProductStatus } from '../../types';
import styles from './Products.module.css';

interface LocalMediaItem {
  id: string;
  url: string;
  file?: File;
}

export default function ProductForm() {
  const { productId } = useParams<{ productId?: string }>();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();
  const { activeStore, activeStoreId } = useActiveStore();
  const { currentUser, userProfile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [inventoryCount, setInventoryCount] = useState<string>('0');
  const [status, setStatus] = useState<ProductStatus>('Published');
  const [mediaList, setMediaList] = useState<LocalMediaItem[]>([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');

  // Load existing product if editing
  useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      try {
        const snap = await getDoc(doc(db, 'products', productId!));
        if (snap.exists()) {
          const data = snap.data() as Product;
          setName(data.name || '');
          setDescription(data.description || '');
          setPrice(data.price?.toString() || '');
          setCompareAtPrice(data.compareAtPrice ? data.compareAtPrice.toString() : '');
          setInventoryCount(data.inventoryCount?.toString() || '0');
          setStatus(data.status || 'Published');
          if (data.images && data.images.length > 0) {
            setMediaList(
              data.images.map((url, i) => ({
                id: `existing-${i}`,
                url,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: LocalMediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newItems.push({
        id: `local-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        file,
      });
    }

    setMediaList((prev) => [...prev, ...newItems].slice(0, 5));
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setMediaList((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        url: urlInput.trim(),
      },
    ].slice(0, 5));

    setUrlInput('');
    setShowUrlModal(false);
  };

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please provide a valid price.');
      return;
    }
    if (!activeStoreId) {
      setError('No active store selected.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload local files to Cloudinary in parallel
      const finalImageUrls: string[] = [];
      for (const item of mediaList) {
        if (item.file) {
          const uploadedUrl = await uploadToCloudinary(item.file);
          finalImageUrls.push(uploadedUrl);
        } else {
          finalImageUrls.push(item.url);
        }
      }

      const performer = {
        uid: currentUser?.uid || '',
        fullName: userProfile?.fullName || currentUser?.displayName || 'Family Member',
      };

      const parsedCompareAt = compareAtPrice ? parseFloat(compareAtPrice) : undefined;
      const parsedInventory = parseInt(inventoryCount, 10) || 0;

      if (isEdit && productId) {
        await updateDoc(doc(db, 'products', productId), {
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          compareAtPrice: parsedCompareAt || null,
          inventoryCount: parsedInventory,
          status,
          images: finalImageUrls,
          updatedAt: serverTimestamp(),
        });

        await logActivity({
          storeId: activeStoreId,
          entityType: 'product',
          entityId: productId,
          action: 'updated',
          summary: `${performer.fullName} updated product "${name.trim()}"`,
          performedBy: performer,
        });
      } else {
        const newDocRef = await addDoc(collection(db, 'products'), {
          storeId: activeStoreId,
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          compareAtPrice: parsedCompareAt || null,
          inventoryCount: parsedInventory,
          status,
          images: finalImageUrls,
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await logActivity({
          storeId: activeStoreId,
          entityType: 'product',
          entityId: newDocRef.id,
          action: 'created',
          summary: `${performer.fullName} created product "${name.trim()}"`,
          performedBy: performer,
        });
      }

      navigate('/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err?.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!productId || !window.confirm('Are you sure you want to archive this product?')) {
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'products', productId), {
        isArchived: true,
        updatedAt: serverTimestamp(),
      });

      const performer = {
        uid: currentUser?.uid || '',
        fullName: userProfile?.fullName || currentUser?.displayName || 'Family Member',
      };

      await logActivity({
        storeId: activeStoreId,
        entityType: 'product',
        entityId: productId,
        action: 'archived',
        summary: `${performer.fullName} archived product "${name}"`,
        performedBy: performer,
      });

      navigate('/products');
    } catch (err: any) {
      setError(err?.message || 'Failed to archive product.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className={styles.container}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Loading product details...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header bar matching Uvodo Web 79 */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <button
            type="button"
            onClick={() => navigate('/products')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              marginBottom: '4px',
            }}
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <h1 className={styles.title}>{isEdit ? 'Edit product' : 'Create product'}</h1>
          <p className={styles.subtitle}>
            Managing catalog for {activeStore?.name || 'Active Store'}
          </p>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/products')} disabled={loading}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            {isEdit ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          {error}
        </div>
      )}

      {/* 2-Column Form matching Uvodo Web 79 */}
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Column: Product Info, Media, Pricing */}
        <div className={styles.column}>
          {/* Main Info Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Product</span>

            <div className={styles.field}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. New York's Best Cafes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                placeholder="Detailed description of the product, features, specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Media Card matching Uvodo */}
          <div className={styles.card}>
            <div className={styles.mediaHeader}>
              <span className={styles.cardTitle}>Media</span>
              <button
                type="button"
                onClick={() => setShowUrlModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Add media from URL
              </button>
            </div>

            {showUrlModal && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button size="sm" variant="primary" onClick={handleAddUrl}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowUrlModal(false)}>
                  Cancel
                </Button>
              </div>
            )}

            <div className={styles.mediaGrid}>
              {mediaList.map((item) => (
                <div key={item.id} className={styles.mediaThumb}>
                  <img src={item.url} alt="Product media" />
                  <button
                    type="button"
                    className={styles.removeThumbBtn}
                    onClick={() => handleRemoveMedia(item.id)}
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {mediaList.length < 5 && (
                <label className={styles.addMediaBox}>
                  <Plus size={28} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              First image is the primary cover. Up to 5 images supported.
            </span>
          </div>

          {/* Pricing Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Pricing</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.field}>
                <label className={styles.label}>Price (PHP ₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Compare-at Price (PHP ₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="Original price if on sale"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status, Inventory, Activity */}
        <div className={styles.column}>
          {/* Status Card matching Uvodo Web 79 */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Product Status</span>

            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={status === 'Draft'}
                onChange={(e) => setStatus(e.target.checked ? 'Draft' : 'Published')}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              Hide this product
            </label>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Hidden / Draft products are not available for sales orders.
            </p>
          </div>

          {/* Inventory Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Inventory</span>

            <div className={styles.field}>
              <label className={styles.label}>Available Stock Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={inventoryCount}
                onChange={(e) => setInventoryCount(e.target.value)}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Automatically deducted when orders are placed.
              </span>
            </div>
          </div>

          {/* Audit Trail for Product */}
          {isEdit && productId && (
            <>
              <ActivityTimeline entityType="product" entityId={productId} limitCount={5} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="danger" size="sm" onClick={handleArchive} leftIcon={<Trash2 size={14} />}>
                  Archive Product
                </Button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
