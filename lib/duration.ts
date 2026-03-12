/**
 * Duration calculation utility
 *
 * Pure function — no dependencies, no side effects.
 * Used by the create form (live preview), program-header (detail view),
 * training grid cards, and trainer dashboard cards.
 */

/**
 * Calculates the human-readable duration between two ISO date strings.
 *
 * Returns:
 *   "X weeks Y days"  — when both are non-zero
 *   "X weeks"         — when days remainder is 0
 *   "Y days"          — when total is less than a week
 *   null              — if either date is missing or endDate ≤ startDate
 */
export function calcDuration(startDate?: string, endDate?: string): string | null {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalise to midnight UTC to avoid DST edge cases
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return null;

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    if (weeks > 0 && days > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
}

/**
 * Formats an ISO date string as "Jan 1, 2026".
 * Returns empty string if the input is falsy.
 */
export function formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
