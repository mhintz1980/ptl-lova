# Error Reporting Format

This project uses a small, structured error shape for client-side error reporting and logging. The goal is to make failures diagnosable without leaking secrets or stack traces to end users.

## Minimal Error Shape

```json
{
  "where": "Store.addPO",
  "what": "Failed to upsert pump rows",
  "correlationId": "optional-request-id",
  "request": {
    "route": "AddPoModal",
    "operation": "upsert pumps",
    "inputSummary": "poPrefix=PO1234 lines=3"
  },
  "message": "Supabase timeout"
}
```

### Field Guidance

- **where**: The logical entry point (module + function).
- **what**: A short summary of the failure.
- **correlationId** (optional): Request or trace ID when available.
- **request** (optional): Safe request context.
  - **route**: UI route or surface name.
  - **operation**: API/operation name.
  - **inputSummary**: Non-sensitive summary (counts, prefixes, IDs truncated).
- **message**: The user-safe error message (no stack traces, no secrets).

## Troubleshooting Notes

- Log the structured error report to `console.error` on the client.
- Keep UI toasts user-friendly and avoid raw error messages.
- Never include credentials, tokens, or full data payloads in `inputSummary`.
