/**
 * Escapes regex metacharacters so untrusted input can be safely embedded
 * in a `RegExp` without risking catastrophic backtracking (ReDoS) or
 * unintended pattern matching.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSafeContainsRegex(input: string, flags = 'i'): RegExp {
  return new RegExp(escapeRegExp(input), flags);
}
