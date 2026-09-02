# Specs Guide

`specs/` is the single source of truth for product and engineering behavior.

## Rules

- Engineering agents must read relevant specs before implementation.
- Engineering agents must not edit specs directly.
- Proposed changes go to `pm/spec-proposals/YYYYMMDD-slug.md`.
- PM-approved changes are applied here and logged in `CHANGELOG.md`.

## Current Spec Files

- `product-rules.md`: product, workflow, and domain rules.
- `api-contract.md`: HTTP API behavior.
- `data-model.md`: PostgreSQL model and tenant boundaries.
- `error-codes.md`: API error response rules.
- `glossary.md`: shared terminology.
- `CHANGELOG.md`: approved spec changes.
