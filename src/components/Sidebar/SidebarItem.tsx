import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface SidebarItemProps {
  path: string;
  icon: React.ReactNode;
  label: string;
}

export default function SidebarItem({ path, icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) =>
        `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}