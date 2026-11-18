/**
 * Logic: playlist/video-related API processing logic only. Fetches EVERY page
 * of results, merges video details (duration) into playlist items, translates
 * raw API shapes into the app's own models, and keeps results in memory. The
 * presentation layer only sees the models returned here. No app, view control
 * in this layer.
 */
import {
  fetchMyPlaylistsPage,
  fetchPlaylistItemsPage,
  fetchVideoDetailsBatch,
} from '../data/api.js';
import { parseDuration } from './duration.js';

/**
 * @typedef {object} Playlist
 * @property {string} id
 * @property {string} title
 * @property {number} videoCount
 */

/**
 * @typedef {object} Video
 * @property {string|null} id
 * @property {string} title
 * @property {string|null} uploader          channel that uploaded the video
 * @property {string|null} uploadedAt        ISO 8601 date the video was uploaded to YT
 * @property {number|null} durationSeconds
 * @property {boolean} available             false if YT returned no details (likely private or deleted)
 */

function toPlaylist(item) {
  return {
    id: item.id,
    title: item.snippet?.title ?? '(untitled)',
    videoCount: item.contentDetails?.itemCount ?? 0,
  };
}

function videoIdOf(item) {
  return item.snippet?.resourceId?.videoId ?? null;
}

function toVideo(item, durationById) {
  const id = videoIdOf(item);
  return {
    id,
    title: item.snippet?.title ?? '(untitled)',
    uploader: item.snippet?.videoOwnerChannelTitle ?? null,
    uploadedAt: item.contentDetails?.videoPublishedAt ?? null,
    durationSeconds: durationById.get(id) ?? null,
    available: durationById.has(id),
  };
}

/**
 * Creates the playlist service. This is a factory (not plain functions)
 * because the service holds state: results are cached so reopening a playlist
 * does not spend API quota again.
 * 
 * Caching is the only state here and is kept in two variables below, so
 * replacing it with IndexedDB later only changes the lines that read/write
 * playlistsCache and videosCache.
 * 
 * @returns {object} members are interface functions for the app controller
 */
export function createPlaylistService() {
  let playlistsCache = null;            // Playlist[] once loaded
  const videosCache = new Map();        // playlist id -> Video[]

  return {
    /**
     * Fetches every one of the user's playlists (all pages).
     * 
     * @param {object} [options]
     * @param {AbortSignal} [options.signal] rejects with AbortError if aborted
     * @returns {Promise<Playlist[]>}
     */
    async getPlaylists({ signal } = {}) {
      if (playlistsCache) return playlistsCache;

      const playlists = [];
      let pageToken = null;
      do {
        const page = await fetchMyPlaylistsPage(pageToken);
        signal?.throwIfAborted();

        playlists.push(...page.items.map(toPlaylist));
        pageToken = page.nextPageToken;
      } while (pageToken);

      playlistsCache = playlists;
      return playlists;
    },

    /**
     * Fetches every video in a playlist (all pages), then merges in durations.
     * Pages must be requested one after another (each needs the previous
     * page's token), but each page's duration lookup is started right away and
     * runs while the next page loads.
     * 
     * @param {string} playlistId
     * @param {object} [options]
     * @param {(loaded: number, total: number|null) => void} [options.onProgress]
     *        called after each page; total is null if the playlist's size is unknown
     * @param {AbortSignal} [options.signal] rejects with AbortError if aborted
     * @returns {Promise<Video[]>} in playlist order
     */
    async loadVideos(playlistId, { onProgress = () => {}, signal } = {}) {
      if (videosCache.has(playlistId)) return videosCache.get(playlistId);

      const total = playlistsCache?.find((p) => p.id === playlistId)?.videoCount ?? null;
      const items = [];                 // raw playlist items, in playlist order
      const detailRequests = [];        // one promise per page's batch of duration lookups
      let pageToken = null;

      do {
        const page = await fetchPlaylistItemsPage(playlistId, pageToken);
        signal?.throwIfAborted();

        items.push(...page.items);
        onProgress(items.length, total);

        // Start this page's duration lookup now; do not wait for it
        const ids = [...new Set(page.items.map(videoIdOf).filter(Boolean))];
        const request = fetchVideoDetailsBatch(ids);
        request.catch(() => {});        // marks it handled; the error is still thrown by Promise.all below
        detailRequests.push(request);

        pageToken = page.nextPageToken;
      } while (pageToken);

      // Wait for all duration lookups (they may finish in any order)
      const batches = await Promise.all(detailRequests);
      signal?.throwIfAborted();

      const durationById = new Map();
      for (const batch of batches) {
        for (const detail of batch) {
          durationById.set(detail.id, parseDuration(detail.contentDetails?.duration));
        }
      }

      const videos = items.map((item) => toVideo(item, durationById));
      videosCache.set(playlistId, videos);       // only complete results are cached
      return videos;
    },

    /**
     * Forgets everything loaded (call on sign-out: playlists may be private).
     */
    clear() {
      playlistsCache = null;
      videosCache.clear();
    },
  };
}