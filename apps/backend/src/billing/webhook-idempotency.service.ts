/**
 * Persistent webhook deduplication.
 *
 * The `webhook_deliveries` table has a UNIQUE (provider, idempotency_key) constraint.
 * `tryRegisterDelivery` returns whether the delivery should be processed:
 *   - true  → row was inserted; caller proceeds.
 *   - false → row already existed (duplicate); caller short-circuits with 200.
 *
 * After successful processing, call `markProcessed`. On error, `markFailed`.
 */

import pool from '../db.js';

export interface DeliveryDescriptor {
  provider: string;
  idempotencyKey: string;
  eventName?: string;
  resourceType?: string;
  resourceId?: string;
  signature?: string;
  payloadHash?: string;
}

export async function tryRegisterDelivery(
  d: DeliveryDescriptor
): Promise<{ id: string; isDuplicate: boolean }> {
  const result = await pool.query(
    `INSERT INTO webhook_deliveries (
        provider, idempotency_key, event_name, resource_type, resource_id, signature, payload_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (provider, idempotency_key)
      DO UPDATE SET attempts = webhook_deliveries.attempts + 1
      RETURNING id, (xmax = 0) AS inserted`,
    [
      d.provider,
      d.idempotencyKey,
      d.eventName || null,
      d.resourceType || null,
      d.resourceId || null,
      d.signature || null,
      d.payloadHash || null,
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    isDuplicate: !row.inserted,
  };
}

export async function markProcessed(deliveryId: string): Promise<void> {
  await pool.query(
    `UPDATE webhook_deliveries
        SET status = 'processed', processed_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [deliveryId]
  );
}

export async function markFailed(
  deliveryId: string,
  errorMessage: string
): Promise<void> {
  await pool.query(
    `UPDATE webhook_deliveries
        SET status = 'failed',
            error_message = $2,
            processed_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [deliveryId, errorMessage.slice(0, 4000)]
  );
}

/** Build an idempotency key from event metadata. */
export function buildLemonSqueezyIdempotencyKey(payload: {
  meta?: { event_name?: string };
  data?: { id?: string; type?: string; attributes?: { updated_at?: string } };
}): string | null {
  const eventName = payload.meta?.event_name;
  const type = payload.data?.type;
  const id = payload.data?.id;
  const updatedAt = payload.data?.attributes?.updated_at || '';
  if (!eventName || !type || !id) return null;
  return [eventName, type, id, updatedAt].join(':');
}
