import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Truck, Store as StoreIcon, Camera } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import useAuth from '../../hooks/useAuth';
import { createOrderWithInventory } from '../../services/orders';
import { Button } from '../../components/buttons/button';
import ProductSelector from '../../components/Orders/ProductSelector';
import { formatPHP } from '../../utils/formatters';
import type { Product, FulfillmentType } from '../../types';
import styles from './Orders.module.css';

interface SelectedItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export default function OrderForm() {
  const navigate = useNavigate();
  const { activeStore, activeStoreId } = useActiveStore();
  const { currentUser, userProfile } = useAuth();

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Customer & fulfillment fields
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');

  // Delivery details
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<string>('0');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Proof of payment
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeStoreId) return;

    async function fetchProducts() {
      const q = query(
        collection(db, 'products'),
        where('storeId', '==', activeStoreId)
      );
      const snap = await getDocs(q);
      const prods = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
        .filter((p) => !p.isArchived && p.status === 'Published');
      setAvailableProducts(prods);
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
      }
    }

    fetchProducts();
  }, [activeStoreId]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = availableProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (prod.inventoryCount <= 0) {
      setError(`"${prod.name}" is currently out of stock.`);
      return;
    }

    setError('');
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        if (existing.quantity >= prod.inventoryCount) {
          setError(`Cannot add more than available stock (${prod.inventoryCount}).`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 1,
          availableStock: prod.inventoryCount,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.availableStock) {
              setError(`Cannot exceed available stock of ${item.availableStock}.`);
              return item;
            }
            setError('');
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as SelectedItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const itemsTotal = selectedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const parsedDeliveryFee = fulfillmentType === 'delivery' ? parseFloat(deliveryFee) || 0 : 0;
  const grandTotal = itemsTotal + parsedDeliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoreId) {
      setError('No active store selected.');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }
    if (fulfillmentType === 'delivery') {
      if (!deliveryAddress.trim()) {
        setError('Delivery address is required.');
        return;
      }
      if (!recipientPhone.trim()) {
        setError('Recipient phone number is required for deliveries.');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const performer = {
        uid: currentUser?.uid || '',
        fullName: userProfile?.fullName || currentUser?.displayName || 'Family Member',
      };

      await createOrderWithInventory({
        storeId: activeStoreId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fulfillmentType,
        deliveryDetails:
          fulfillmentType === 'delivery'
            ? {
                address: deliveryAddress.trim(),
                recipientPhone: recipientPhone.trim(),
                deliveryFee: parsedDeliveryFee,
                notes: deliveryNotes.trim(),
              }
            : undefined,
        deliveryFee: parsedDeliveryFee,
        items: selectedItems,
        proofOfPaymentFile: proofFile,
        performer,
      });

      navigate('/orders');
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err?.message || 'Failed to record order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              marginBottom: '4px',
            }}
          >
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h1 className={styles.title}>Record New Order</h1>
          <p className={styles.subtitle}>
            Recording sales transaction for {activeStore?.name || 'Active Store'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => navigate('/orders')} disabled={loading}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Record Order
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Column: Products & Line Items */}
        <div className={styles.column}>
          {/* Product Selector Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Add Products</span>

            <div className={styles.productSelectorRow}>
              <ProductSelector
                products={availableProducts}
                selectedProductId={selectedProductId}
                onSelect={(id) => setSelectedProductId(id)}
                disabled={availableProducts.length === 0}
              />
              <Button
                type="button"
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={handleAddItem}
                disabled={availableProducts.length === 0 || !selectedProductId}
              >
                Add to Order
              </Button>
            </div>

            {/* Selected Items Table */}
            <div style={{ marginTop: '12px' }}>
              {selectedItems.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  No items added yet. Select a product above to add to this order.
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.productId} className={styles.itemRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.productName}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {formatPHP(item.unitPrice)} each
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className={styles.qtyControl}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => handleUpdateQty(item.productId, -1)}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => handleUpdateQty(item.productId, 1)}
                        >
                          +
                        </button>
                      </div>

                      <span style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPHP(item.unitPrice * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fulfillment Details Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Fulfillment Method</span>

            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${fulfillmentType === 'pickup' ? styles.toggleBtnActive : ''}`}
                onClick={() => setFulfillmentType('pickup')}
              >
                <StoreIcon size={16} />
                <span>In-Store / Pickup</span>
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${fulfillmentType === 'delivery' ? styles.toggleBtnActive : ''}`}
                onClick={() => setFulfillmentType('delivery')}
              >
                <Truck size={16} />
                <span>Delivery</span>
              </button>
            </div>

            {fulfillmentType === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Delivery Address *</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Street, building, subdivision, landmarks..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={styles.field}>
                    <label className={styles.label}>Recipient Contact Phone *</label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="e.g. 0917 123 4567"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Delivery Fee (PHP ₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.input}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Special Delivery Instructions</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Gate code, leave with guard..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Payment Proof & Order Summary */}
        <div className={styles.column}>
          {/* Customer Details Card */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Customer Details</span>

            <div className={styles.field}>
              <label className={styles.label}>Customer Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contact Number (optional)</label>
              <input
                type="tel"
                className={styles.input}
                placeholder="e.g. 0917 000 0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Proof of Payment Screenshot */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Proof of Payment (Optional)</span>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Attach electronic transaction screenshot (GCash, Maya, Bank Transfer).
            </p>

            <label className={styles.proofBox}>
              {proofPreview ? (
                <img src={proofPreview} alt="Payment Proof" className={styles.proofPreview} />
              ) : (
                <>
                  <Camera size={24} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Upload Screenshot
                  </span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleProofChange} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Order Financial Summary */}
          <div className={styles.card}>
            <span className={styles.cardTitle}>Payment Summary</span>

            <div className={styles.summaryRow}>
              <span>Items Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPHP(itemsTotal)}</span>
            </div>

            {fulfillmentType === 'delivery' && (
              <div className={styles.summaryRow}>
                <span>Delivery Fee</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPHP(parsedDeliveryFee)}</span>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPHP(grandTotal)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={selectedItems.length === 0}
              style={{ marginTop: '12px', width: '100%' }}
            >
              Record & Deduct Stock
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
