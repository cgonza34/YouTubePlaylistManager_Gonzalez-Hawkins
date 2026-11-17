/**
 * Logic: YT API logic implementation only. Retrieves data from user's YT
 * account using API calls; requires OAuth accessToken. One function handles
 * building the URL and returning YT data for every API call: check the YT API
 * reference page for passing the right parameters to apiGet. No app, view
 * control in this layer.
 */
import { getToken, expireToken } from './auth.js';
import { AuthError, ApiError } from '../errors.js';

const BASE = 'https://www.googleapis.com/youtube/v3';       // base URL for calling the API

/**
 * Builds URL for all API calls and queries YT API services; keeps URL error
 * handling localized.
 * 
 * @param {string} path URL extension: which service/data to request
 * @param {object} params members are strings that tell the API which group(s)
 *                        of data to request (part) and from which channel to
 *                        request them (mine, id, forHandle)
 * @returns API response as json
 */
async function apiGet(path, params) {
  // Ask auth-related logic for accessToken and check validity (e.g. not expired)
  const token = getToken();
  if (!token) throw new AuthError('Not signed in (or the token expired).');

  // Build URL by concatenating path strings and encoding params
  const url = `${BASE}/${path}?${new URLSearchParams(params)}`;

  // Pass accessToken in header and await API response at URL
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Check for 401 Unauthorized
  if (response.status === 401) {
    expireToken();
    throw new AuthError('Google rejected the token.');
  }

  // Check for API error
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const reason = body?.error?.errors?.[0]?.reason ?? body?.error?.status ?? 'unknown';
    throw new ApiError(response.status, reason, `YouTube API error ${response.status} (${reason})`);
  }

  // Return API response
  return response.json();
}

/**
 * Fetches a basic descriptive summary of user's own channel; costs 1 quota
 * unit.
 * 
 * @returns channel summary as json or null if channel does not exist
 */
export async function fetchMyChannel() {
  const data = await apiGet('channels', { part: 'snippet', mine: 'true' });
  return data.items?.[0] ?? null;
}