# Deferred Media Upload Strategy

## Context
When creating or editing stores, products, or user profiles, users upload image files.
Uploading directly upon file selection creates orphaned files on Cloudinary when users cancel forms, discard changes, or close the browser tab.
Because client-side applications cannot securely hold Cloudinary administrative API secrets to run delete operations, orphaned assets would accumulate.

## Decision
File inputs hold native `File` objects in component state and display instantaneous local preview URLs generated via `URL.createObjectURL(file)`.
The actual upload to Cloudinary occurs only when the user commits the form by clicking the Save or Add button.
If the form is cancelled or closed, no network upload request is sent to Cloudinary, preventing orphaned assets.

## Considered Options
- Immediate upload upon selection: Uploading files as soon as chosen.
Rejected because discarding or navigating away from the form leaves orphaned media in Cloudinary without clean client-side deletion options.
- Serverless deletion endpoint: Creating a Cloud Function with Cloudinary API secrets to delete assets when Discard is clicked.
Rejected because it fails when users close the tab without clicking Discard and introduces unnecessary backend infrastructure.

## Consequences
Provides zero-latency image previews in the browser while filling forms.
Prevents orphaned files on Cloudinary completely without backend code.
The user experiences a brief upload progress indicator during form submission while images upload prior to writing Firestore documents.
