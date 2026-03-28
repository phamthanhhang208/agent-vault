/**
 * Audit Logging
 *
 * Immutable record of all agent activity.
 * Stored in Vercel KV with timestamp-based keys for chronological ordering.
 *
 * TODO: Phase 6 — implement storage and retrieval
 */

import type { AuditEntry, RiskLevel, AuditStatus } from '@/types';
// import { kv, setJson, getByPrefix } from './kv';

/**
 * Log an action to the audit trail.
 */
export async function logAction(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
  const auditEntry: AuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  // TODO: Phase 6
  // const key = `audit:${userId}:${auditEntry.timestamp}:${auditEntry.id}`;
  // await setJson(key, auditEntry);

  console.log('[Audit]', auditEntry);
  return auditEntry;
}

/**
 * Retrieve audit log entries for a user.
 * Returns entries sorted by timestamp (newest first).
 */
export async function getAuditLog(
  userId: string,
  options?: {
    limit?: number;
    agentId?: string;
    service?: string;
    status?: AuditStatus;
  }
): Promise<AuditEntry[]> {
  // TODO: Phase 6
  // 1. Scan keys with prefix audit:{userId}:
  // 2. Fetch all entries
  // 3. Apply filters (agentId, service, status)
  // 4. Sort by timestamp descending
  // 5. Apply limit

  return [];
}

/**
 * Get aggregate stats for the dashboard overview.
 */
export async function getAuditStats(userId: string): Promise<{
  actionsToday: number;
  totalActions: number;
}> {
  // TODO: Phase 6
  // Count entries from today vs all time

  return {
    actionsToday: 0,
    totalActions: 0,
  };
}
