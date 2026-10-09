# Store Manager

A lightweight internal management system for a family to operate their portfolio of retail businesses.
It centralizes product catalogs, inventory tracking, and sales order processing across multiple family-owned storefronts.

## Language

**Store**:
A distinct retail business entity operated by the family, maintaining its own catalog, inventory, and orders.
_Avoid_: Shop, company, branch, workspace

**Active Store**:
The currently selected store within the application context that filters catalog items and sales operations.
_Avoid_: Selected store, current tenant, active context

**Product**:
An item offered for sale within a specific store, having defined pricing in Philippine Peso (PHP), inventory count, and media assets.
_Avoid_: Item, listing, merchandise, SKU

**Order**:
A record of a sales transaction for a store, capturing customer contact details, purchased items, quantities, fulfillment method, proof of payment, and current processing status.
_Avoid_: Purchase, receipt, invoice, sale

**Fulfillment**:
The method chosen to deliver goods to a customer, categorized as either In-Store Pickup or Delivery.
_Avoid_: Shipping, logistics, dispatch

**Proof of Payment**:
An optional uploaded screenshot or image documenting electronic payment verification for an order.
_Avoid_: Receipt slip, invoice attachment, payment voucher

**Order Status**:
The formal lifecycle stage of an order, strictly defined as Pending, Preparing, Out for Delivery, Completed, or Cancelled.
In-flight orders in Preparing or Out for Delivery may be reset back to Pending.
Completed and Cancelled are irreversible terminal statuses that cannot be modified.
_Avoid_: Order state, delivery status, phase

**Inventory Adjustment**:
The atomic deduction or restitution of product stock tied to order lifecycle events to prevent double counting.
_Avoid_: Stock mutation, count update, inventory edit

**Archival**:
The soft deletion mechanism marking a store or product as retired without destroying historical records in past transactions.
_Avoid_: Deletion, purge, removal, trash

**User Profile**:
The personal identification metadata for an authenticated family member, requiring a full display name and an optional avatar image.
_Avoid_: User settings, account info, bio

**Audit Log**:
An immutable historical entry documenting a create, update, or delete operation performed on a store or product, attributing the action to a specific user.
_Avoid_: History, changelog, activity stream, revision

**User**:
An authenticated family member with administrative rights to access and operate all family stores.
_Avoid_: Account, client, staff, employee
