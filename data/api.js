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
const MAX_PAGE_SIZE = 50;                                   // YT API maximum for maxResults, and for IDs per videos.list call

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
 * Reshapes a list response into the two things callers need: this page's
 * items, and the token for requesting the next page (null on the last page).
 * 
 * @param {object} data API list response as json
 * @returns {{items: object[], nextPageToken: string|null}}
 */
function toPage(data) {
  return { items: data.items ?? [], nextPageToken: data.nextPageToken ?? null };
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

/**
 * Fetches ONE page (up to 50) of the user's own playlists; costs 1 quota unit.
 * The fields param trims the response to what the app uses (this also leaves
 * out thumbnails). To get every playlist, the caller (a service) repeats this
 * call, passing back each nextPageToken, until nextPageToken is null.
 * 
 * @param {string|null} [pageToken] nextPageToken from the previous page; omit
 *                                  for the first page
 * @returns {Promise<{items: object[], nextPageToken: string|null}>} each item
 *          looks like {id, snippet: {title}, contentDetails: {itemCount}}
 */
export async function fetchMyPlaylistsPage(pageToken = null) {
  const params = {
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: String(MAX_PAGE_SIZE),
    fields: 'nextPageToken,items(id,snippet/title,contentDetails/itemCount)',
  };
  // Only add pageToken when there is one (an undefined value would be sent as
  // the text "undefined")
  if (pageToken) params.pageToken = pageToken;

  return toPage(await apiGet('playlists', params));
}

/**
 * Fetches ONE page (up to 50) of the videos in a playlist; costs 1 quota unit.
 * Pages depend on each other (each needs the previous page's nextPageToken),
 * so the caller must request them one after another.
 * 
 * Items have no duration: request it separately with fetchVideoDetailsBatch.
 * snippet.publishedAt (not requested) is when the video was ADDED to the
 * playlist; contentDetails.videoPublishedAt is when it was UPLOADED to YT.
 * Private and deleted videos come back with placeholder titles and no
 * videoOwnerChannelTitle or videoPublishedAt.
 * 
 * @param {string} playlistId playlist to read
 * @param {string|null} [pageToken] nextPageToken from the previous page; omit
 *                                  for the first page
 * @returns {Promise<{items: object[], nextPageToken: string|null}>} each item
 *          looks like {snippet: {title, videoOwnerChannelTitle, resourceId:
 *          {videoId}}, contentDetails: {videoPublishedAt}}
 */
export async function fetchPlaylistItemsPage(playlistId, pageToken = null) {
  const params = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(MAX_PAGE_SIZE),
    fields: 'nextPageToken,items(snippet(title,videoOwnerChannelTitle,resourceId/videoId),contentDetails/videoPublishedAt)',
  };
  if (pageToken) params.pageToken = pageToken;

  return toPage(await apiGet('playlistItems', params));
}

/**
 * Fetches details for up to 50 specific videos in ONE call; costs 1 quota
 * unit. Currently requests only duration (ISO 8601, e.g. "PT1H2M3S"). To cover
 * a longer list of videos, the caller splits the IDs into chunks of 50.
 * 
 * Videos that are private or deleted are missing from the result (not an
 * error): the caller should match results to IDs, not assume the same count.
 * 
 * @param {string[]} videoIds at most 50 video IDs
 * @returns {Promise<object[]>} each item looks like {id, contentDetails:
 *          {duration}}
 * @throws {RangeError} if more than 50 IDs are passed
 */
export async function fetchVideoDetailsBatch(videoIds) {
  if (videoIds.length === 0) return [];
  if (videoIds.length > MAX_PAGE_SIZE) {
    throw new RangeError(`At most ${MAX_PAGE_SIZE} video IDs per call (got ${videoIds.length}).`);
  }

  const data = await apiGet('videos', {
    part: 'contentDetails',
    id: videoIds.join(','),
    fields: 'items(id,contentDetails/duration)',
  });
  return data.items ?? [];
}