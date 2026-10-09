# Order Payment and Fulfillment Model

## Context
The family businesses process both in-store walk-in sales and delivery orders.
Orders can be paid in cash or via online payment channels requiring transaction verification.

## Decision
For MVP, every recorded order is treated as paid upon creation.
Orders track an optional `proofOfPaymentUrl` uploaded to Cloudinary for electronic transaction screenshots.
Fulfillment is modeled as an enum (`pickup` vs `delivery`).
When fulfillment is `delivery`, mandatory delivery address, recipient phone number, delivery notes, and delivery fee are captured.
The order lifecycle follows a unified 5-stage progression: `Pending` -> `Preparing` -> `Out for Delivery` -> `Completed` (or `Cancelled`).

## Considered Options
- Decoupled payment and fulfillment state machines: Tracking `paymentStatus` and `fulfillmentStatus` independently.
Rejected for MVP because it creates combinatorial status permutations that complicate internal family operations.
- Cash-on-delivery tracking system: Tracking unpaid delivery balances.
Deferred to post-MVP iterations once external payment reconciliation is introduced.

## Consequences
Streamlines internal family operations with a single, clear order status progression.
Enables visual verification of bank/wallet transfers directly inside order details via proof-of-payment image attachments.
Calculates total order amounts inclusive of optional delivery fees.
