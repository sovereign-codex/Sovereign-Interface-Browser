import { GuardrailViolation } from '../sovereign/guardrails';

const MAX_VIOLATIONS = 20;

const violations: GuardrailViolation[] = [];

export const recordViolation = (violation: GuardrailViolation): void => {
  violations.unshift(violation);
  if (violations.length > MAX_VIOLATIONS) {
    violations.splice(MAX_VIOLATIONS, violations.length - MAX_VIOLATIONS);
  }
};

export const getViolations = (limit = MAX_VIOLATIONS): GuardrailViolation[] => violations.slice(0, limit);

export const violationSummary = (): Record<GuardrailViolation['severity'], number> => ({
  low: violations.filter((v) => v.severity === 'low').length,
  medium: violations.filter((v) => v.severity === 'medium').length,
  high: violations.filter((v) => v.severity === 'high').length,
});
