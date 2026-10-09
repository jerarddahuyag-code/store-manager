import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store as StoreIcon, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useActiveStore from '../../hooks/useActiveStore';
import styles from './Sidebar.module.css';

export default function StorePicker() {
  const { stores, activeStore, activeStoreId, setActiveStoreId } = useActiveStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStore = (storeId: string) => {
    setActiveStoreId(storeId);
    setIsOpen(false);
  };

  const handleCreateStore = () => {
    setIsOpen(false);
    navigate('/stores/new');
  };

  return (
    <div className={styles.pickerWrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.pickerTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.pickerStoreInfo}>
          {activeStore?.logoUrl ? (
            <img src={activeStore.logoUrl} alt="" className={styles.storeLogoThumbnail} />
          ) : (
            <div className={styles.storeLogoThumbnail}>
              <StoreIcon size={14} />
            </div>
          )}
          <span className={styles.storeName}>
            {activeStore ? activeStore.name : stores.length > 0 ? 'Select Store' : 'No Stores Yet'}
          </span>
        </div>
        <ChevronDown size={14} style={{ color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div className={styles.pickerMenu}>
          {stores.length > 0 ? (
            stores.map((store) => (
              <button
                key={store.id}
                type="button"
                className={`${styles.pickerItem} ${store.id === activeStoreId ? styles.pickerItemActive : ''}`}
                onClick={() => handleSelectStore(store.id)}
              >
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt="" className={styles.storeLogoThumbnail} />
                ) : (
                  <div className={styles.storeLogoThumbnail}>
                    <StoreIcon size={12} />
                  </div>
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {store.name}
                </span>
                {store.id === activeStoreId && <Check size={14} style={{ color: '#818CF8' }} />}
              </button>
            ))
          ) : (
            <div style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)', color: '#64748B' }}>
              No stores created
            </div>
          )}

          <div className={styles.pickerDivider} />

          <button type="button" className={styles.addStoreBtn} onClick={handleCreateStore}>
            <Plus size={14} />
            <span>Create New Store</span>
          </button>
        </div>
      )}
    </div>
  );
}