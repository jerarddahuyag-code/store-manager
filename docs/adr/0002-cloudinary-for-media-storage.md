# Cloudinary for Media Storage

## Context
The store manager requires storing store banners, user profile pictures, and product pictures.
Firebase Storage requires upgrading to the paid Blaze plan, which violates the requirement to stay within free tier services.

## Decision
We chose Cloudinary's free tier as the primary media storage provider using unsigned upload presets from the client.
Image URLs returned by Cloudinary are stored directly on Firestore documents (stores, products, users).

## Considered Options
- Firebase Storage: Rejected due to mandatory Blaze pay-as-you-go billing requirements.
- Cloudflare R2: Rejected for MVP due to requirement of custom backend workers or presigned URL handling for client uploads.
- Base64 encoding in Firestore: Rejected due to document size bloat and the 1 MB Firestore document limit.

## Consequences
Keeps the entire infrastructure zero-cost on the free tier.
Direct unsigned uploads allow the React client to upload assets without needing a custom server or cloud functions.
Enables Cloudinary dynamic image optimization, automated thumbnail generation, and responsive delivery.
