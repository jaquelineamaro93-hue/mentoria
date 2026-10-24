# SaaS recovery offer

The seven-day card-free trial is unchanged. A new unpaid SaaS customer returning from a pending checkout, or choosing to leave that checkout, can explain why. Selecting price cancels the old pending provider subscription and creates a single account offer, after the original trial has ended. Legacy mentorship students and accounts with paid/refunded/charged-back SaaS payments are excluded.

The account must accept within a server-enforced 15-minute window. Reloading never resets it. Acceptance reserves one checkout so provider interruptions can be retried after that window. This deadline governs acceptance of the offer, not the time taken to enter card details at Mercado Pago. The UI states this explicitly.

First software month: avulso R$19.90, essencial R$27.90, pro R$55.90. Later months: R$24.90, R$34.90, R$69.90. Agents remain R$150 individually or R$250 together throughout. Mentorship, onboarding and meetings are excluded. Acceptance stores terms version and timestamp. Both prices are disclosed in the dialog and provider subscription description.

Orders retain the normal recurring amount, with a separate introductory amount. Only the first approved payment ID can use the introductory price. SQL serializes payment handling, rejects repeated discounted renewals, and preserves duplicate/refund handling. Verified webhooks immediately restore the recurring price through Mercado Pago's PUT preapproval API. Failed restoration returns a retryable webhook error. An order with intro_payment_id and no recurring_price_restored_at is a durable reconciliation task, also retried by the existing daily authenticated reminders cron. Restoration is marked complete only after the provider returns the correct subscription ID and price. Canceled subscriptions are excluded.

Offer creation, acceptance and paid conversion can be measured from soma_saas_recovery_offers joined to its order and payment events. No messages are sent. Closing an external Mercado Pago tab cannot be observed directly by this site; the prompt appears on return to the platform or the explicit pending-checkout abandonment control.

Validation: tests/saas-recovery.sql uses synthetic users and rolls back every fixture. Node tests exercise all agent combinations, provider/database failure retries, mismatched provider responses, forged client prices, expiry, auth, and original signed webhook/legacy history regressions. No real card was charged during validation.

Provider reference: https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/update-preapproval/put
