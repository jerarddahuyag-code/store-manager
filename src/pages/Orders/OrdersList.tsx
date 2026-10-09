import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ShoppingBag,
  Truck,
  Store as StoreIcon,
  X,
  ChevronRight,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useActiveStore from '../../hooks/useActiveStore';
import useAuth from '../../hooks/useAuth';
import { updateOrderStatus } from '../../services/orders';
import { Button } from '../../components/buttons/button';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { formatPHP, formatDate, getTimeMs } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../types';
import styles from './Orders.module.css';

export default function OrdersList() {
  const { activeStore, activeStoreId } = useActiveStore();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'reset';
    order: Order | null;
  }>({
    isOpen: false,
    type: 'cancel',
    order: null,
  });

  useEffect(() => {
    if (!activeStoreId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', activeStoreId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, 'id'>),
        }));

        loaded.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

        setOrders(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeStoreId]);

  const handleAdvanceStatus = async (order: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let nextStatus: OrderStatus | null = null;
    if (order.status === 'Pending') nextStatus = 'Preparing';
    else if (order.status === 'Preparing') nextStatus = 'Out for Delivery';
    else if (order.status === 'Out for Delivery') nextStatus = 'Completed';

    if (!nextStatus) return;

    try {
      setTransitioningId(order.id);
      const performer = {
        uid: currentUser?.uid || '',
        fullName: userProfile?.fullName || currentUser?.displayName || 'Family Member',
      };
      await updateOrderStatus(order.id, nextStatus, performer);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus! } : null));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setTransitioningId(null);
    }
  };

  const handleOpenConfirm = (type: 'cancel' | 'reset', order: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmModal({
      isOpen: true,
      type,
      order,
    });
  };

  const handleExecuteConfirm = async () => {
    if (!confirmModal.order) return;
    const targetOrder = confirmModal.order;
    const newStatus: OrderStatus = confirmModal.type === 'cancel' ? 'Cancelled' : 'Pending';

    try {
      setTransitioningId(targetOrder.id);
      const performer = {
        uid: currentUser?.uid || '',
        fullName: userProfile?.fullName || currentUser?.displayName || 'Family Member',
      };
      await updateOrderStatus(targetOrder.id, newStatus, performer);
      if (selectedOrder?.id === targetOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setConfirmModal({ isOpen: false, type: 'cancel', order: null });
    } catch (err) {
      console.error(`Failed to ${confirmModal.type} order:`, err);
    } finally {
      setTransitioningId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'All') return true;
    return o.status === statusFilter;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return styles.statusPending;
      case 'Preparing':
        return styles.statusPreparing;
      case 'Out for Delivery':
        return styles.statusOutForDelivery;
      case 'Completed':
        return styles.statusCompleted;
      case 'Cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  if (!activeStore) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
          Please select an active store to view sales orders.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>
            Order fulfillment and delivery tracking for {activeStore.name}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => navigate('/orders/new')}
        >
          Record Order
        </Button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(['All', 'Pending', 'Preparing', 'Out for Delivery', 'Completed', 'Cancelled'] as const).map(
          (filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                borderColor: statusFilter === filter ? 'var(--color-primary)' : 'var(--color-border-default)',
                background: statusFilter === filter ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
                color: statusFilter === filter ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px dashed var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShoppingBag size={36} style={{ color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            No orders found
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', maxWidth: '360px' }}>
            Record in-store counter purchases or delivery orders to monitor your business sales.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => navigate('/orders/new')}
          >
            Record Order
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Fulfillment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isTransitioning = transitioningId === order.id;

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      {order.customerPhone && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {order.customerPhone}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={styles.fulfillmentTag}>
                        {order.fulfillmentType === 'delivery' ? (
                          <>
                            <Truck size={12} /> Delivery
                          </>
                        ) : (
                          <>
                            <StoreIcon size={12} /> Pickup
                          </>
                        )}
                      </span>
                    </td>

                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {formatPHP(order.totalAmount)}
                    </td>

                    <td>
                      <span className={`${styles.orderStatusBadge} ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            className={styles.toggleBtn}
                            style={{
                              border: '1px solid var(--color-border-default)',
                              background: 'var(--color-bg-surface)',
                              padding: '4px 10px',
                            }}
                            onClick={(e) => handleAdvanceStatus(order, e)}
                            disabled={isTransitioning}
                            title="Advance to next status"
                          >
                            <span>
                              {order.status === 'Pending' && 'Start Preparing'}
                              {order.status === 'Preparing' && 'Out for Delivery'}
                              {order.status === 'Out for Delivery' && 'Complete'}
                            </span>
                            <ChevronRight size={14} />
                          </button>
                        )}

                        {(order.status === 'Preparing' || order.status === 'Out for Delivery') && (
                          <button
                            type="button"
                            className={styles.resetBtn}
                            onClick={(e) => handleOpenConfirm('reset', order, e)}
                            disabled={isTransitioning}
                            title="Reset order status to Pending"
                          >
                            <RotateCcw size={13} />
                            <span>Reset</span>
                          </button>
                        )}

                        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            onClick={(e) => handleOpenConfirm('cancel', order, e)}
                            disabled={isTransitioning}
                            title="Cancel order and restore inventory"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className={styles.mobileCardsContainer}>
          {filteredOrders.map((order) => {
            const isTransitioning = transitioningId === order.id;

            return (
              <div
                key={`mobile-${order.id}`}
                className={styles.mobileOrderCard}
                onClick={() => setSelectedOrder(order)}
              >
                <div className={styles.mobileCardHeader}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {order.orderNumber}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span className={`${styles.orderStatusBadge} ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.mobileCardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {order.customerName}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPHP(order.totalAmount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={styles.fulfillmentTag}>
                      {order.fulfillmentType === 'delivery' ? (
                        <>
                          <Truck size={12} /> Delivery
                        </>
                      ) : (
                        <>
                          <StoreIcon size={12} /> Pickup
                        </>
                      )}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className={styles.mobileCardFooter}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Tap for details
                  </div>
                  <div className={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <button
                        type="button"
                        className={styles.toggleBtn}
                        style={{
                          border: '1px solid var(--color-border-default)',
                          background: 'var(--color-bg-surface)',
                          padding: '6px 12px',
                        }}
                        onClick={(e) => handleAdvanceStatus(order, e)}
                        disabled={isTransitioning}
                      >
                        <span>
                          {order.status === 'Pending' && 'Prepare'}
                          {order.status === 'Preparing' && 'Deliver'}
                          {order.status === 'Out for Delivery' && 'Complete'}
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    )}

                    {(order.status === 'Preparing' || order.status === 'Out for Delivery') && (
                      <button
                        type="button"
                        className={styles.resetBtn}
                        style={{ padding: '6px 10px' }}
                        onClick={(e) => handleOpenConfirm('reset', order, e)}
                        disabled={isTransitioning}
                        title="Reset to Pending"
                      >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                      </button>
                    )}

                    {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                        onClick={(e) => handleOpenConfirm('cancel', order, e)}
                        disabled={isTransitioning}
                        title="Cancel order"
                      >
                        <Ban size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                  {selectedOrder.orderNumber}
                </h2>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Placed on {formatDate(selectedOrder.createdAt)} by {selectedOrder.createdBy?.fullName || 'User'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Status & Fulfillment */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`${styles.orderStatusBadge} ${getStatusBadgeClass(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
              <span className={styles.fulfillmentTag}>
                {selectedOrder.fulfillmentType === 'delivery' ? 'Delivery' : 'In-Store Pickup'}
              </span>
            </div>

            {/* Customer Details */}
            <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Customer
              </div>
              <div style={{ fontWeight: 600 }}>{selectedOrder.customerName}</div>
              {selectedOrder.customerPhone && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  Phone: {selectedOrder.customerPhone}
                </div>
              )}
            </div>

            {/* Delivery Details if applicable */}
            {selectedOrder.fulfillmentType === 'delivery' && selectedOrder.deliveryDetails && (
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  Delivery Address & Courier Notes
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                  {selectedOrder.deliveryDetails.address}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Rider Contact: {selectedOrder.deliveryDetails.recipientPhone}
                </div>
                {selectedOrder.deliveryDetails.notes && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Note: "{selectedOrder.deliveryDetails.notes}"
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Order Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatPHP(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span>Items Subtotal</span>
                <span>{formatPHP(selectedOrder.itemsTotal)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>Delivery Fee</span>
                  <span>{formatPHP(selectedOrder.deliveryFee)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
                <span>Total Amount</span>
                <span>{formatPHP(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Proof of Payment Screenshot */}
            {selectedOrder.proofOfPaymentUrl && (
              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Proof of Payment Attachment
                </div>
                <a
                  href={selectedOrder.proofOfPaymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'block', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border-default)' }}
                >
                  <img
                    src={selectedOrder.proofOfPaymentUrl}
                    alt="Proof of Payment"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#0F172A' }}
                  />
                </a>
              </div>
            )}
            {/* Modal Actions */}
            {selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Cancelled' && (
              <div
                style={{
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '16px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                {(selectedOrder.status === 'Preparing' || selectedOrder.status === 'Out for Delivery') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RotateCcw size={14} />}
                    onClick={() => handleOpenConfirm('reset', selectedOrder)}
                    disabled={transitioningId === selectedOrder.id}
                  >
                    Reset to Pending
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Ban size={14} />}
                  onClick={() => handleOpenConfirm('cancel', selectedOrder)}
                  disabled={transitioningId === selectedOrder.id}
                  style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Cancel Order
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<ChevronRight size={14} />}
                  onClick={() => handleAdvanceStatus(selectedOrder)}
                  disabled={transitioningId === selectedOrder.id}
                >
                  {selectedOrder.status === 'Pending' && 'Start Preparing'}
                  {selectedOrder.status === 'Preparing' && 'Out for Delivery'}
                  {selectedOrder.status === 'Out for Delivery' && 'Complete Order'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styled Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'cancel'
            ? `Cancel Order ${confirmModal.order?.orderNumber}`
            : `Reset Order ${confirmModal.order?.orderNumber}`
        }
        description={
          confirmModal.type === 'cancel'
            ? 'Are you sure you want to cancel this order? Deducted product stocks will be automatically restored to your store inventory.'
            : 'Revert this order back to Pending status? This signals your store team to prepare the order again. Stock deductions will remain in place.'
        }
        confirmLabel={
          confirmModal.type === 'cancel' ? 'Yes, Cancel Order' : 'Reset to Pending'
        }
        cancelLabel="Keep Order"
        variant={confirmModal.type === 'cancel' ? 'danger' : 'warning'}
        loading={Boolean(transitioningId)}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'cancel', order: null })}
      />
    </div>
  );
}
