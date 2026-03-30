/**
 * Audit Logging
 *
 * Immutable record of all agent activity.
 * Stored in Vercel KV with timestamp-based keys for chronological ordering.
 */

import { setJson, scanKeys, getJson } from './kv';
import type { AuditEntry, AuditStatus, RiskLevel } from '@/types';
import { nanoid } from 'nanoid';

/**
 * Log an action to the audit trail.
 */
export async function logAction(
  userId: string,
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): Promise<AuditEntry> {
  const auditEntry: AuditEntry = {
    ...entry,
    id: `aud_${nanoid(12)}`,
    timestamp: new Date().toISOString(),
  };

  const key = `audit:${userId}:${auditEntry.timestamp}:${auditEntry.id}`;
  await setJson(key, auditEntry);

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
  const keys = await scanKeys(`audit:${userId}:*`);
  if (keys.length === 0) return [];

  const entries = await Promise.all(
    keys.map((key) => getJson<AuditEntry>(key))
  );

  let results = entries.filter((e): e is AuditEntry => e !== null);

  // Apply filters
  if (options?.agentId) {
    results = results.filter((e) => e.agentId === options.agentId);
  }
  if (options?.service) {
    results = results.filter((e) => e.service === options.service);
  }
  if (options?.status) {
    results = results.filter((e) => e.status === options.status);
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Get aggregate stats for the dashboard overview.
 */
export async function getAuditStats(userId: string): Promise<{
  actionsToday: number;
  totalActions: number;
}> {
  const keys = await scanKeys(`audit:${userId}:*`);
  const totalActions = keys.length;

  // Count today's actions
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayKeys = keys.filter((k) => k.includes(today));

  return {
    actionsToday: todayKeys.length,
    totalActions,
  };
}
