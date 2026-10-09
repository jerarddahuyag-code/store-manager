# Order Lifecycle Transitions and Terminal States

## Context
Orders progress through lifecycle statuses from creation to fulfillment.
Users require the ability to reset mistakenly advanced in-flight orders back to Pending.
However, allowing completed or cancelled orders to be reverted introduces severe race conditions and inventory inconsistencies.

## Decision
Order statuses are strictly partitioned into active in-flight states (`Pending`, `Preparing`, `Out for Delivery`) and terminal states (`Completed`, `Cancelled`).
In-flight orders may transition forward or be reset back to `Pending`.
Orders in `Completed` or `Cancelled` status cannot be reset or modified.
Inventory for active orders remains deducted throughout all in-flight transitions.
If an order was cancelled and its inventory was restored, family members must create a new order rather than reviving the cancelled order.

## Considered Options
- Allowing cancelled orders to be revived back to Pending with dynamic inventory re-deduction:
Rejected because inventory may have been depleted by intervening sales, leading to unexpected transaction failures or overselling.
- Allowing completed orders to be reverted:
Rejected because completed orders represent final accounting and fulfilled deliveries.

## Consequences
Guarantees inventory invariants without complex rollback logic.
Protects historical sales accounting and simplifies lifecycle status management in UI components.
