# Error Codes

## Error Shape

All API errors return JSON:

```json
{ "error": "Human readable message" }
```

## Status Rules

- `400 Bad Request`: invalid JSON body, missing required input, unsupported enum.
- `401 Unauthorized`: no valid IAP or local dev auth header.
- `403 Forbidden`: authenticated user lacks membership or permission.
- `404 Not Found`: route not found or scoped resource not found.
- `500 Internal Server Error`: unexpected server error.

## Security Rules

- Do not leak whether a resource exists in another organization.
- Cross-organization resources must return 404, not 403.
- Error messages should be useful for operators but must not include secrets or connection strings.
