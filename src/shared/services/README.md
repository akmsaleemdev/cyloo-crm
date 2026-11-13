# Services

Adapters and clients that abstract external systems.

- `messaging/` — provider-agnostic MessageProvider interface (mock, Meta Cloud API, on-prem).
- AI services use the configured direct provider adapters under `src/lib/ai/` (chat, summaries, copy).
- `analytics/` — event tracking abstraction.
- `storage/` — file storage helpers.
