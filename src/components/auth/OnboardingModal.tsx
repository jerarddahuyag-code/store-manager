import React, { useState } from 'react';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import styles from './OnboardingModal.module.css';

export default function OnboardingModal() {
  const { currentUser, needsOnboarding, completeOnboarding } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!currentUser || !needsOnboarding) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await completeOnboarding(fullName.trim(), avatarFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome to Store Manager</h2>
          <p className={styles.subtitle}>
            You are signed in as <strong>{currentUser.email}</strong>. Please enter your full name and an optional photo to identify your actions in the shared family workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.avatarSection}>
            <label className={styles.avatarWrapper}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar preview" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <Camera size={24} />
                  <span>Photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.hiddenInput}
              />
            </label>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Click above to upload photo (optional)
            </span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                Setting up...
              </>
            ) : (
              'Get Started'
            )}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 0',
            }}
          >
            <LogOut size={14} />
            <span>Not you? Sign out or switch account</span>
          </button>
        </form>
      </div>
    </div>
  );
}
