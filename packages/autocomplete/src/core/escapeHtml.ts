/**
 * Escapes a value for safe interpolation into an HTML template string.
 *
 * Item templates (`template`, `history_template`, `footer_template`) assign
 * their returned string via `innerHTML`, so any field that may contain
 * user-generated content must be passed through this helper to avoid injecting
 * markup or scripts into the host page.
 */
export default function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
