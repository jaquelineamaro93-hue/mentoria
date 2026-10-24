# Contracts, administration and product isolation

Review date: 24 October 2026. Scope: authenticated purchase contracts, administration navigation, route authorization, database role/ownership tests, IP-based abuse controls and existing payment regression coverage. No offensive test against real customers or real-card charge was performed.

## Contracts and acceptance

Public /contratos separates SOMA Carreira, SOMA Plataforma and additional purchases. New mentoring purchases and extras require explicit current-version acceptance, checked by the payment API before any order or provider operation. Commercial snapshots include server-selected plan, duration, total and installments. Software orders retain selected modules, agents, normal/introductory prices, version and acceptance time. New software trials also pin the current version. Recovery contracts disclose both prices, one-account eligibility and the acceptance deadline.

New documents are stored in product_contract_versions. Existing mentoring versions and their 47 acceptances were not overwritten, auto-accepted or deleted. /termos shows account-owned historical documents and purchase records; an old order without a full attached document is identified as such rather than being relabeled with today's text. Cancellation and payment confirmation remain separate from acceptance.

New Carreira acceptance satisfies the contract checks for the Copilot without forcing the buyer to accept the older bundled image clause. An inactive copy of that new document supplies the contractual reference for a new buyer's optional pause. Existing students continue with their existing terms. The pause SQL eligibility, 60-day accumulated limit, payment behavior and historical records are retained. Synthetic tests verify new-contract pause eligibility and ownership of acceptance.

Image/publicity authorization is optional and separate in the new purchase contracts. Seven days of free trial do not replace statutory withdrawal rights. The documents preserve consumer rights and distinguish a fixed mentoring package paid in installments from a monthly software subscription.

## Administration

The empty space and right-hand button stack were replaced with a responsive grid of eight areas. Less frequent actions remain visible below it. Subpages share navigation back to the overview and related areas. The server layout independently requires administrator authorization. Plans and contracts includes a searchable read-only register of existing and new acceptances. Existing operations and routes remain available; no messages were sent during validation.

## Authorization and privacy

Sensitive product APIs validate session and current product within each handler, independently of Proxy. Unknown/inactive states fail closed. The shared career tool resolves its module from the body without consuming it or trusting a supplied user ID. Individual module permissions do not imply another module, an agent or human mentorship. Copilot context excludes human onboarding for SaaS-only accounts and excludes CV fallback without CV module permission. Queries remain scoped to the authenticated account.

SaaS accounts cannot start a second legacy mentoring trial through direct trial requests or the common identity helper. Client profile insertion was removed because the existing auth trigger creates profiles; arbitrary profile INSERT requests can no longer supply administrator or subscription fields. Direct RPC execution of trigger-only SECURITY DEFINER functions was removed; normal triggers were verified by own-profile and own-PDI writes. Intended public 360 invitation RPCs were retained.

Vercel deployments use the edge-provided x-vercel-forwarded-for, require a valid IP and ignore generic caller-supplied forwarding chains. Other runtimes use a stable unknown bucket until a trusted ingress is explicitly configured. Identifier limits are independent of IP for requests that supply an identity. Authenticated AI operations retain per-account quotas. Provider callbacks and cron remain service-authenticated.

Every public database table was observed with RLS enabled. Private backend tables intentionally without client policies continue to deny clients. Supabase warnings for authenticated SECURITY DEFINER helpers are reviewed by intent; they are not blanket-revoked because that would disable authorized functionality.

## Validation and practical limits

Node tests cover module/agent matrices, direct unauthorized handler calls before private data/AI, IP spoofing, independent identity quotas, contract acceptance and forged client prices. SQL tests use two synthetic accounts with the real authenticated role, verify private conversations cannot be read across users, prevent cross-user PDI updates, allow own updates, isolate paid modules and verify versioned contract recognition. All SQL fixtures roll back.

Existing payment tests cover signatures, provider reconciliation, duplicates, refund/out-of-order behavior and recovery pricing. They do not replace a real checkout/cancellation/refund test in the merchant account. Environment secrets were not exposed or collected. Production deployment status must be checked against the merged GitHub commit.

Fingerprints before/after the migration and SQL tests matched for profiles (52), historical acceptances (47), maps (23), self-knowledge answers (143), PDI plans (8), PDI actions (106), CV simulations (21) and Iris messages (100).

References:

- https://vercel.com/docs/headers/request-headers
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- See api-authorization-inventory.md for the complete route inventory.
