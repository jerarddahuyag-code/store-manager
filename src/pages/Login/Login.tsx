import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, Loader2 } from 'lucide-react';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import styles from './Login.module.css';

export default function Login() {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const errCode = (err as { code?: string })?.code;
      if (
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (errCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few moments and try again.');
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to sign in.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.brandBadge}>
              <Store size={24} />
            </div>
            <h1 className={styles.title}>Already Signed In</h1>
            <p className={styles.subtitle}>
              You are currently signed in as <strong>{currentUser.email}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => navigate('/')}
            >
              Continue to Dashboard
            </button>
            <button
              type="button"
              onClick={() => signOut(auth)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-default)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandBadge}>
            <Store size={24} />
          </div>
          <h1 className={styles.title}>Store Manager</h1>
          <p className={styles.subtitle}>Family business administration portal</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSignIn} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="family@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className={styles.footerNote}>
          Authorized family accounts only. User creation is restricted to the administrator in Firebase Console.
        </p>
      </div>
    </div>
  );
}