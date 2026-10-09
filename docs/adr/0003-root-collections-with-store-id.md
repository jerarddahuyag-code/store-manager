# Root Collections with Store ID References

## Context
Stores, products, and orders need to be modeled in Cloud Firestore.
While subcollections (`stores/{id}/products/{id}`) provide visual scoping, future analytics requirements require querying sales, inventory levels, and top products across all family businesses.

## Decision
We chose root-level Firestore collections (`stores`, `products`, `orders`, `activity_logs`) with each entity containing a mandatory `storeId` foreign key field.
Client-side views filter data by `storeId == activeStoreId`, while cross-store analytics can query the root collections directly without collection group index complexity.

## Considered Options
- Nested subcollections: `stores/{storeId}/products/{productId}` and `stores/{storeId}/orders/{orderId}`.
Rejected because querying aggregated family metrics across all stores requires Firestore Collection Group queries, which require manual composite index generation for every filter.
- Multi-database instances: Completely separate Firestore databases per store.
Rejected because it adds heavy operational overhead and prevents unified management.

## Consequences
Requires composite indexes on root collections when querying by `storeId` sorted by timestamp or status.
Simplifies cross-store reporting and global search across all family businesses.
