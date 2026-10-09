import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary } from './cloudinary';
import { logActivity } from './activityLogs';
import type { Order, OrderItem, OrderStatus, FulfillmentType, DeliveryDetails } from '../types';

export interface CreateOrderParams {
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  fulfillmentType: FulfillmentType;
  deliveryDetails?: DeliveryDetails;
  proofOfPaymentFile?: File | null;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }>;
  deliveryFee?: number;
  performer: {
    uid: string;
    fullName: string;
  };
}

/**
 * Creates an order and decrements product inventory within an atomic Firestore transaction.
 */
export async function createOrderWithInventory(params: CreateOrderParams): Promise<string> {
  const {
    storeId,
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryDetails,
    proofOfPaymentFile,
    items,
    deliveryFee = 0,
    performer,
  } = params;

  if (items.length === 0) {
    throw new Error('An order must contain at least one item.');
  }

  // Upload proof of payment if provided (deferred upload prior to Firestore transaction)
  let proofOfPaymentUrl = '';
  if (proofOfPaymentFile) {
    proofOfPaymentUrl = await uploadToCloudinary(proofOfPaymentFile);
  }

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

  const calculatedItems: OrderItem[] = items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.unitPrice * item.quantity,
  }));

  const itemsTotal = calculatedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const finalDeliveryFee = fulfillmentType === 'delivery' ? deliveryFee : 0;
  const totalAmount = itemsTotal + finalDeliveryFee;

  const ordersRef = collection(db, 'orders');
  const newOrderDocRef = doc(ordersRef);

  await runTransaction(db, async (transaction) => {
    // 1. Read all product documents to check stock
    const productDocs = await Promise.all(
      calculatedItems.map((item) => transaction.get(doc(db, 'products', item.productId)))
    );

    // Validate inventory availability
    for (let i = 0; i < calculatedItems.length; i++) {
      const pDoc = productDocs[i];
      const item = calculatedItems[i];

      if (!pDoc.exists()) {
        throw new Error(`Product "${item.productName}" no longer exists.`);
      }

      const pData = pDoc.data();
      const currentStock = pData?.inventoryCount ?? 0;

      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.productName}". Available: ${currentStock}, Requested: ${item.quantity}`
        );
      }
    }

    // 2. Decrement inventory for each product
    for (let i = 0; i < calculatedItems.length; i++) {
      const pDoc = productDocs[i];
      const item = calculatedItems[i];
      const pData = pDoc.data();
      const newStock = Math.max(0, (pData?.inventoryCount ?? 0) - item.quantity);

      transaction.update(pDoc.ref, {
        inventoryCount: newStock,
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Create the order document
    transaction.set(newOrderDocRef, {
      storeId,
      orderNumber,
      customerName: customerName?.trim() || 'Walk-in Customer',
      customerPhone: customerPhone?.trim() || '',
      fulfillmentType,
      deliveryDetails: fulfillmentType === 'delivery' ? deliveryDetails : null,
      proofOfPaymentUrl: proofOfPaymentUrl || null,
      items: calculatedItems,
      itemsTotal,
      deliveryFee: finalDeliveryFee,
      totalAmount,
      status: 'Pending' as OrderStatus,
      inventoryStatus: 'deducted',
      createdAt: serverTimestamp(),
      createdBy: performer,
    });
  });

  await logActivity({
    storeId,
    entityType: 'store',
    entityId: storeId,
    action: 'created',
    summary: `${performer.fullName} recorded order ${orderNumber} (${formatTotal(totalAmount)})`,
    performedBy: performer,
  });

  return newOrderDocRef.id;
}

/**
 * Transitions order status. If cancelling, safely re-increments product stock.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  performer: { uid: string; fullName: string }
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);

  let storeId = '';
  let orderNumber = '';

  await runTransaction(db, async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists()) {
      throw new Error('Order does not exist.');
    }

    const orderData = orderDoc.data() as Order;
    const currentStatus = orderData.status;
    storeId = orderData.storeId;
    orderNumber = orderData.orderNumber;

    if (currentStatus === newStatus) {
      return; // No-op
    }

    // Terminal statuses cannot be modified
    if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
      throw new Error(`Cannot change status of an order that is already ${currentStatus}.`);
    }

    // If resetting to Pending, only allow from in-flight statuses
    if (newStatus === 'Pending' && currentStatus !== 'Preparing' && currentStatus !== 'Out for Delivery') {
      throw new Error(`Cannot reset an order to Pending from ${currentStatus}.`);
    }

    // If cancelling an order whose inventory was deducted, restore the inventory
    if (newStatus === 'Cancelled' && orderData.inventoryStatus === 'deducted') {
      const productDocs = await Promise.all(
        orderData.items.map((item) => transaction.get(doc(db, 'products', item.productId)))
      );

      for (let i = 0; i < orderData.items.length; i++) {
        const pDoc = productDocs[i];
        const item = orderData.items[i];
        if (pDoc.exists()) {
          const currentStock = pDoc.data()?.inventoryCount ?? 0;
          transaction.update(pDoc.ref, {
            inventoryCount: currentStock + item.quantity,
            updatedAt: serverTimestamp(),
          });
        }
      }

      transaction.update(orderRef, {
        status: newStatus,
        inventoryStatus: 'restored',
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.update(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    }
  });

  const summary =
    newStatus === 'Pending'
      ? `${performer.fullName} reset order ${orderNumber} status to Pending`
      : newStatus === 'Cancelled'
      ? `${performer.fullName} cancelled order ${orderNumber} (inventory restored)`
      : `${performer.fullName} updated order ${orderNumber} status to "${newStatus}"`;

  await logActivity({
    storeId: storeId || '',
    entityType: 'store',
    entityId: orderId,
    action: 'updated',
    summary,
    performedBy: performer,
  });
}

function formatTotal(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}
