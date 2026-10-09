# Philippine Peso Currency Standardization

## Context
The family businesses operate in the Philippines and conduct financial transactions exclusively in Philippine Peso (PHP).
Introducing multi-currency conversions or exchange rate lookups adds unnecessary complexity to sales calculations and order records.

## Decision
All monetary amounts across stores, products, delivery fees, and order totals are standardized to Philippine Peso (`PHP`, formatted as `₱`).
Pricing figures are stored in the database as numeric decimal values and formatted with standard Philippine Peso locale formatting.

## Considered Options
- Multi-currency selection per store: Permitting each store to choose an arbitrary currency.
Rejected because all family businesses operate locally in PHP, and multi-currency formatting complicates aggregate reporting.

## Consequences
Simplifies pricing calculation, invoicing, and reporting across all stores.
Enables unified formatting helpers without currency conversion overhead.
