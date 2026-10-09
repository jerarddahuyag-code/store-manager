import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  House,
  Package,
  ShoppingBag,
  Menu,
  X,
  Store,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { auth } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import useAuth from '../../hooks/useAuth';
import StorePicker from '../Sidebar/StorePicker';
import styles from './MobileNav.module.css';

export default function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { activeStore } = useActiveStore();
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer upon route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      setDrawerOpen(false);
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayName = userProfile?.fullName || currentUser?.displayName || 'Family Member';
  const avatarUrl = userProfile?.avatarUrl || currentUser?.photoURL;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Top Bar */}
      <header className={styles.mobileTopBar}>
        <div className={styles.brandGroup} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className={styles.brandIcon}>
            <Store size={16} />
          </div>
          <span className={styles.activeStoreBadge}>
            {activeStore ? activeStore.name : 'Store Manager'}
          </span>
        </div>

        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerBrand}>
                <div className={styles.brandIcon}>
                  <Store size={16} />
                </div>
                <span>Store Manager</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Store Picker on mobile */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                Active Store
              </div>
              <StorePicker />
            </div>

            <nav className={styles.drawerNav}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '8px 0 4px', letterSpacing: '0.05em' }}>
                Menu
              </div>

              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
                }
              >
                <House size={18} />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
                }
              >
                <Package size={18} />
                <span>Products</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
                }
              >
                <ShoppingBag size={18} />
                <span>Orders</span>
              </NavLink>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '16px 0 4px', letterSpacing: '0.05em' }}>
                Preferences
              </div>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
                }
              >
                <SettingsIcon size={18} />
                <span>Settings</span>
              </NavLink>
            </nav>

            <div className={styles.drawerFooter}>
              <div className={styles.drawerUser}>
                <div className={styles.drawerUserInfo}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatar}>{initials || 'FM'}</div>
                  )}
                  <div className={styles.userMeta}>
                    <span className={styles.userName}>{displayName}</span>
                    <span className={styles.userEmail}>{currentUser?.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.mobileBottomBar}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
          }
        >
          <House size={20} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
          }
        >
          <Package size={20} />
          <span>Products</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
          }
        >
          <ShoppingBag size={20} />
          <span>Orders</span>
        </NavLink>
      </nav>
    </>
  );
}
