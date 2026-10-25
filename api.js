import { getToken } from './auth.js';

const BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Confirms the connection by fetching the signed-in user's channel.
 * Costs 1 quota unit. Returns null if the Google account has no YouTube channel.
 */
export async function fetchMyChannel() {
  const token = getToken();
  if (!token) throw new Error('Not signed in (or the token expired).');

  const response = await fetch(`${BASE}/channels?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`YouTube API error ${response.status}`);
  }
  const data = await response.json();
  return data.items?.[0] ?? null;
}