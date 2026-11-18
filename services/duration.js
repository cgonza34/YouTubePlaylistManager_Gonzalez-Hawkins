/**
 * Logic: duration parsing only. Pure function (no DOM, no API calls), so it is
 * easy to unit-test. No app, view control in this layer.
 */

// ISO 8601 durations as YT returns them: PT45S, PT3M20S, PT1H2M3S, P1DT2H, P0D
const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/**
 * Converts an ISO 8601 duration (as returned by the YT API) to total seconds.
 * 
 * @param {string|undefined} iso e.g. "PT1H2M3S"
 * @returns {number|null} total seconds, or null if the text is not a duration
 */
export function parseDuration(iso) {
  if (typeof iso !== 'string') return null;

  const match = ISO_DURATION.exec(iso);
  // "P" and "PT" alone (and a trailing "T" with nothing after) are not valid
  if (!match || iso === 'P' || iso.endsWith('T')) return null;

  // Groups that did not appear in the text are undefined: default them to 0
  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match;
  return Number(days) * 86400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}