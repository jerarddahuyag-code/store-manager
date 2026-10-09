import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Package, Check } from 'lucide-react';
import { formatPHP } from '../../utils/formatters';
import type { Product } from '../../types';
import styles from './ProductSelector.module.css';

export interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
  disabled?: boolean;
}

export default function ProductSelector({
  products,
  selectedProductId,
  onSelect,
  disabled = false,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: string) => {
    onSelect(productId);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || products.length === 0}
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          {selectedProduct ? (
            <>
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt=""
                  className={styles.productThumbnail}
                />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <Package size={14} />
                </div>
              )}
              <span className={styles.selectedName}>{selectedProduct.name}</span>
              <span className={styles.selectedPrice}>
                {formatPHP(selectedProduct.price)}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>
              {products.length === 0
                ? 'No published products in this store'
                : 'Select a product...'}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {products.map((p) => {
            const isOutOfStock = p.inventoryCount <= 0;
            const isSelected = p.id === selectedProductId;

            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.menuItem} ${isSelected ? styles.menuItemActive : ''}`}
                onClick={() => handleSelect(p.id)}
                disabled={isOutOfStock}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className={styles.productThumbnail} />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <Package size={14} />
                  </div>
                )}

                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{p.name}</span>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPrice}>{formatPHP(p.price)}</span>
                    <span
                      className={`${styles.stockBadge} ${
                        isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn
                      }`}
                    >
                      {isOutOfStock ? 'Out of stock' : `${p.inventoryCount} in stock`}
                    </span>
                  </div>
                </div>

                {isSelected && <Check size={16} style={{ color: 'var(--color-primary)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
