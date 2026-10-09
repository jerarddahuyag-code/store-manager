import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import MobileNav from '../Navigation/MobileNav';
import OnboardingModal from '../auth/OnboardingModal';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.layout}>
      <MobileNav />
      <Sidebar />
      <main className={styles.layoutContent}>
        <Outlet />
      </main>
      <OnboardingModal />
    </div>
  );
}