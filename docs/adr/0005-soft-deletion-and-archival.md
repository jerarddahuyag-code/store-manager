# Soft Deletion and Entity Archival

## Context
In a retail management system, stores and products are linked to financial transactions and sales orders.
Permanently deleting a store or product from Firestore destroys relational integrity, causes orphaned references in order histories, and skews sales reporting.

## Decision
All delete operations on stores and products perform soft deletion via an `isArchived: true` flag and status change.
Active catalog queries filter for `isArchived != true`, while historical order lookups and audit trails preserve access to original entity details.

## Considered Options
- Hard document deletion (`deleteDoc`): Permanently removing records from Firestore.
Rejected because orders referencing deleted products lose original title, image, and category context.
- Moving to a dedicated trash collection: Copying documents into a `/trash` collection.
Rejected because it introduces unnecessary multi-document write overhead and complex restoration logic.

## Consequences
Queries for active lists must explicitly filter out archived documents or sort using appropriate indexes.
Historical orders and audit logs remain completely intact and verifiable over time.
Entities can be restored if archived inadvertently.
