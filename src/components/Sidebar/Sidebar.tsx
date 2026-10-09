import { signOut } from 'firebase/auth';
import {
  House,
  Package,
  ShoppingBag,
  Settings as SettingsIcon,
  LogOut,
  Store,
} from 'lucide-react';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import StorePicker from './StorePicker';
import SidebarItem from './SidebarItem';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { currentUser, userProfile } = useAuth();

  const handleLogout = async () => {
    try {
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
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Store size={18} />
          </div>
          <span className={styles.brandName}>Store Manager</span>
        </div>
        <StorePicker />
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSectionTitle}>Menu</div>
        <SidebarItem path="/" icon={<House size={18} />} label="Overview" />
        <SidebarItem path="/products" icon={<Package size={18} />} label="Products" />
        <SidebarItem path="/orders" icon={<ShoppingBag size={18} />} label="Orders" />

        <div className={styles.navSectionTitle} style={{ marginTop: 'auto' }}>
          Preferences
        </div>
        <SidebarItem path="/settings" icon={<SettingsIcon size={18} />} label="Settings" />
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.userInfo}>
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
            className={styles.signOutBtn}
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}