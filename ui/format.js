/**
 * Presentation: text formatting for display only. Pure functions: no DOM, no
 * API calls, no imports. No app control, logic implementation in this layer.
 */

/**
 * @param {number|null} seconds
 * @returns {string} e.g. "3:07" or "1:02:03" ("—" if unknown)
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/**
 * Shows the date part of an ISO 8601 timestamp as written (UTC), so every
 * user sees the same text regardless of locale or time zone.
 * 
 * @param {string|null} iso e.g. "2021-03-14T09:26:53Z"
 * @returns {string} e.g. "2021-03-14" ("—" if unknown)
 */
export function formatDate(iso) {
  return iso ? iso.slice(0, 10) : '—';
}

/**
 * @param {number} n
 * @returns {string} e.g. "5,000" (formatted for the user's locale)
 */
export function formatCount(n) {
  return n.toLocaleString();
}