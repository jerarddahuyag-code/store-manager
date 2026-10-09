# Idempotent Inventory Transactions and Order Transitions

## Context
When orders are placed, product inventory must be deducted to maintain stock accuracy.
When orders are cancelled, deducted inventory must be restored.
Network retries, rapid double clicks, or concurrent browser tabs can cause duplicate inventory deductions or race conditions.

## Decision
All order creation and order status transitions that alter inventory will execute within atomic Firestore transactions (`runTransaction`).
The order document tracks an `inventoryStatus` state (`deducted`, `restored`, or `none`).
Before updating stock numbers, the transaction validates the order's current `inventoryStatus` and status transitions before applying atomic field increments (`FieldValue.increment`).

## Considered Options
- Optimistic non-transactional writes: Writing the order document and updating products in separate batch calls.
Rejected because partial network failures or browser crashes leave inventory desynchronized.
- Webhook / background function queues: Moving all stock logic to Cloud Functions.
Rejected for MVP to avoid backend serverless cold starts and additional infrastructure.

## Consequences
Guarantees inventory integrity and stock consistency without external queues or serverless background workers.
Prevents duplicate deductions if a user submits an order twice or rapidly changes order statuses.
Transactions fail gracefully if product stock is insufficient.
