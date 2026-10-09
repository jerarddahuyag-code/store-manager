import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Image, ArrowLeft, Trash2 } from 'lucide-react';
import useActiveStore from '../../hooks/useActiveStore';
import { Button } from '../../components/buttons/button';
import ActivityTimeline from '../../components/ActivityLog/ActivityTimeline';
import styles from './StoreForm.module.css';

export default function StoreForm() {
  const { storeId } = useParams<{ storeId?: string }>();
  const isEdit = Boolean(storeId);
  const navigate = useNavigate();
  const { stores, createStore, updateStore, archiveStore } = useActiveStore();

  const existingStore = isEdit ? stores.find((s) => s.id === storeId) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingStore) {
      setName(existingStore.name || '');
      setDescription(existingStore.description || '');
      if (existingStore.bannerUrl) setBannerPreview(existingStore.bannerUrl);
      if (existingStore.logoUrl) setLogoPreview(existingStore.logoUrl);
    }
  }, [existingStore]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Store name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isEdit && storeId) {
        await updateStore(
          storeId,
          { name: name.trim(), description: description.trim() },
          bannerFile,
          logoFile
        );
      } else {
        await createStore(
          { name: name.trim(), description: description.trim() },
          bannerFile,
          logoFile
        );
      }

      navigate('/');
    } catch (err: any) {
      console.error('Failed to save store:', err);
      setError(err?.message || 'Failed to save store.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!storeId || !window.confirm('Are you sure you want to archive this store? It will be hidden from active navigation.')) {
      return;
    }

    try {
      setLoading(true);
      await archiveStore(storeId);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to archive store.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <button
            type="button"
            onClick={() => navigate('/')}
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
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <h1 className={styles.title}>{isEdit ? 'Edit Store' : 'Create New Store'}</h1>
          <p className={styles.subtitle}>
            {isEdit ? 'Update store brand identity and settings' : 'Set up a new storefront for your family portfolio'}
          </p>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/')} disabled={loading}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            {isEdit ? 'Save Changes' : 'Create Store'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div>
          <h2 className={styles.sectionTitle}>Store Visuals</h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Banner cover and store logo will appear on the overview and navigation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Banner Cover</label>
              <label className={styles.bannerUploadArea}>
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className={styles.bannerPreview} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
                    <Image size={28} />
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Click to upload store banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Store Logo</label>
              <div className={styles.logoUploadRow}>
                <label className={styles.logoUploadArea}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className={styles.logoPreview} />
                  ) : (
                    <Camera size={22} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Square store avatar</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Recommended: 200x200px PNG or JPG</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className={styles.sectionTitle}>Store Details</h2>

          <div className={styles.field}>
            <label className={styles.label}>Store Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Mama's Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Brief description of this business..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Operating Currency</label>
            <input
              type="text"
              className={styles.input}
              value="Philippine Peso (PHP - ₱)"
              disabled
              style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }}
            />
          </div>
        </div>
      </form>

      {isEdit && storeId && (
        <>
          <ActivityTimeline entityType="store" entityId={storeId} limitCount={5} />

          <div className={styles.dangerZone}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-danger-text)' }}>Archive Store</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-text)', opacity: 0.85 }}>
                Soft deletes this store. Historical orders and products will be preserved.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleArchive} leftIcon={<Trash2 size={14} />}>
              Archive
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
