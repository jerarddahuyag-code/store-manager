import React, { useState, useEffect } from 'react';
import { Camera, Check, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { Button } from '../components/buttons/button';
import styles from './Settings.module.css';

export default function Settings() {
  const { currentUser, userProfile, updateUserProfileData } = useAuth();

  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      if (userProfile.avatarUrl) setAvatarPreview(userProfile.avatarUrl);
    } else if (currentUser?.displayName) {
      setFullName(currentUser.displayName);
      if (currentUser.photoURL) setAvatarPreview(currentUser.photoURL);
    }
  }, [userProfile, currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      await updateUserProfileData(fullName.trim(), avatarFile);
      setSuccess(true);
      setAvatarFile(null);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleArea}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>
          Manage your personal profile and display preferences in the family portal
        </p>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--color-success-subtle)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          <Check size={16} /> Profile updated successfully.
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.sectionTitle}>User Profile</h2>

        <div className={styles.avatarRow}>
          <label className={styles.avatarWrapper}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className={styles.avatarImage} />
            ) : (
              <Camera size={22} style={{ color: 'var(--color-text-muted)' }} />
            )}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Profile Photo
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Click avatar to select a photo. Uploaded to Cloudinary on save.
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email Address</label>
          <input
            type="email"
            className={styles.input}
            value={currentUser?.email || ''}
            disabled
            style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }}
          />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Managed by administrator via Firebase Console.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Full Name *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSuccess(false);
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}