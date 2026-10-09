import type { Timestamp, FieldValue } from 'firebase/firestore';

export type FirestoreDate = Timestamp | FieldValue | Date | null | undefined;

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt?: FirestoreDate;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  logoUrl?: string;
  currency: 'PHP';
  isArchived?: boolean;
  createdAt?: FirestoreDate;
  createdBy: {
    uid: string;
    fullName: string;
  };
}

export type ProductStatus = 'Published' | 'Draft';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  inventoryCount: number;
  images: string[];
  status: ProductStatus;
  isArchived?: boolean;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface DeliveryDetails {
  address: string;
  recipientPhone: string;
  deliveryFee: number;
  notes?: string;
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentType: FulfillmentType;
  deliveryDetails?: DeliveryDetails | null;
  proofOfPaymentUrl?: string | null;
  items: OrderItem[];
  itemsTotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  inventoryStatus: 'deducted' | 'restored';
  createdAt?: FirestoreDate;
  createdBy: {
    uid: string;
    fullName: string;
  };
}

export type ActivityAction = 'created' | 'updated' | 'archived';
export type ActivityEntityType = 'store' | 'product';

export interface ActivityLog {
  id: string;
  storeId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  summary: string;
  performedBy: {
    uid: string;
    fullName: string;
  };
  timestamp?: FirestoreDate;
}
