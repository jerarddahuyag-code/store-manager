# Shared Family Workspace Tenancy Model

## Context
The application serves a single family operating multiple retail storefronts.
While individual family members have unique login credentials, they collaborate on managing all businesses rather than requiring isolated personal silos.

## Decision
We adopted a single-tenant shared family workspace model where all authenticated users have full access to view and manage all stores, products, and orders.
Attribution and accountability are preserved through audit logging rather than restrictive multi-tenant permission barriers.

## Considered Options
- Per-user data isolation: Each user only sees stores they created.
Rejected because family members need cross-store operational visibility and shared workload capabilities.
- Role-based access control (RBAC): Differentiating owners vs staff.
Rejected for MVP because all users are trusted family members, making role configuration unnecessary overhead.

## Consequences
Simplifies Firestore data modeling and security rules significantly.
Stores, products, and orders are stored uniformly under top-level or store-scoped collections without complex permission trees.
