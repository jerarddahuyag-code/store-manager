import { Store as StoreIcon } from 'lucide-react';
import type { Store } from '../../types';
import styles from './StoreCard.module.css';

interface StoreCardProps {
  store: Store;
  isActive: boolean;
  onSelect: () => void;
}

export default function StoreCard({ store, isActive, onSelect }: StoreCardProps) {
  return (
    <div
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
    >
      <div className={styles.banner}>
        {store.bannerUrl && (
          <img src={store.bannerUrl} alt="" className={styles.bannerImage} />
        )}
        {isActive && <span className={styles.activeBadge}>Active Store</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.logoBadge}>
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className={styles.logoImage} />
          ) : (
            <StoreIcon size={20} />
          )}
        </div>
        <h3 className={styles.name}>{store.name}</h3>
        {store.description && <p className={styles.description}>{store.description}</p>}
      </div>
    </div>
  );
}