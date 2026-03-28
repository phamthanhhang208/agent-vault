/**
 * Policy Engine
 *
 * Evaluates whether an agent is allowed to perform a specific action.
 * Checks the agent's policy matrix and returns the appropriate state.
 *
 * TODO: Phase 4 — wire into MCP server tool execution
 */

import type { Agent, PolicyState } from '@/types';

/**
 * Evaluate whether an agent can perform an action on a service.
 *
 * Resolution order:
 * 1. Exact match: repos.read
 * 2. Wildcard match: issues.* matches issues.create, issues.list, etc.
 * 3. Default: block (if no rule matches, action is blocked)
 */
export function evaluateAction(
  agent: Agent,
  service: string,
  action: string
): PolicyState {
  const policy = agent.policies.find((p) => p.service === service);
  if (!policy) return 'block';

  // Exact match first
  const exactRule = policy.rules.find((r) => r.action === action);
  if (exactRule) return exactRule.state;

  // Wildcard match: e.g. "issues.*" matches "issues.create"
  const actionPrefix = action.split('.')[0];
  const wildcardRule = policy.rules.find(
    (r) => r.action === `${actionPrefix}.*`
  );
  if (wildcardRule) return wildcardRule.state;

  // Default: block
  return 'block';
}

/**
 * Check if a specific tool call should proceed, require approval, or be blocked.
 * Returns an object with the decision and metadata for audit logging.
 */
export function evaluateToolCall(
  agent: Agent,
  toolName: string,
  service: string,
  action: string
): {
  decision: PolicyState;
  reason: string;
} {
  const decision = evaluateAction(agent, service, action);

  const reasons: Record<PolicyState, string> = {
    allow: 'Action is auto-allowed by policy',
    approval: 'Action requires human approval (write-protected)',
    block: 'Action is blocked by policy',
  };

  return {
    decision,
    reason: reasons[decision],
  };
}
