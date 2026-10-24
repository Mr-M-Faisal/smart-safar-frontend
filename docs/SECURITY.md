# Smart Safar security notes

## Authentication token storage

The frontend and API are deployed on different domains. Refresh tokens therefore remain in the existing browser `localStorage` session flow; this phase does not introduce cookies that would be cross-site or depend on third-party-cookie behavior. The tradeoff is that any successful same-origin script injection could read a token. Keep access tokens short-lived, rotate refresh tokens on use, revoke them on sign-out, and minimize script sources. The Content Security Policy is currently report-only so violations can be inspected before enforcement. Do not put credentials in URLs or logs.

## Browser policy and external services

The frontend middleware sends a per-response nonce Content Security Policy in report-only mode. Google Identity Services and OpenStreetMap tiles are explicitly listed because the current app uses them. Keep the API and websocket origins derived from `NEXT_PUBLIC_API_URL`; production values must be HTTPS. Review browser console reports on the deployed domains before switching to enforcement. Do not add `unsafe-eval` or script `unsafe-inline` to silence a report.

## Realtime limits

Socket connections have a per-connection event limit, a 64 KiB payload ceiling, and a cap on application rooms. Bus room IDs are checked as Mongo ObjectIds. Passenger and driver booking rooms still require their existing signed-token and role/active-shift checks. The general bus room remains a public live-data subscription; never emit passenger identity, booking details, or private location data to it.

## Sharing and packaging

Before sharing a project archive, remove `.git`, `node_modules`, `.next`, build outputs, coverage, logs, and all local `.env*` files. Keep only the checked-in `.env.example` templates and replace their placeholder values with no credentials. Do not share cloud credentials, private keys, database dumps, user data, or deployment environment files. The AWS build and deployment files are kept intact by the security phase.

## Known dependency upgrade

The backend audit is clean after safe dependency updates. The frontend runtime audit still flags the pinned Next.js 14 line and its bundled PostCSS version; npm only offers a fix that moves to Next.js 16. Next.js 14 is outside the currently supported release lines. This is a major framework and Node runtime change, so it is intentionally not forced into the security patch while the AWS CodeBuild runtime is unverified and the deployment setup must stay unchanged. Before production release, verify the configured CodeBuild Node version and complete a separate Next.js 16 migration, then rerun this project’s build and browser checks. Do not treat the remaining frontend audit as cleared.

## Verification

Run `npm run verify` from `frontend/` to execute unit checks, build the production app, run Playwright browser journeys, and collect Lighthouse budgets in sequence. The browser CSP is report-only; Lighthouse and E2E failures must be resolved or recorded before release. Backend unit checks are `npm run test:unit` from `backend/`. The full backend suite also needs the configured test MongoDB service.
