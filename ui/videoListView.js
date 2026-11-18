/**
 * Presentation: video list view control only. Shows every video of one
 * playlist at once (no pagination): rows are plain text and cheap, and the
 * browser's own find (Ctrl+F) can then search the whole playlist. No app
 * control, logic implementation in this layer.
 */
import { formatCount, formatDate, formatDuration } from './format.js';

/**
 * Creates the video list view control.
 * 
 * @param {Document} root the global HTML object
 * @returns {object} members are interface functions that can be called by the
 *                   app controller
 */
export function createVideoListView(root = document) {
  // Select video-related DOM elements
  const section = root.querySelector('#videos-section');
  const titleEl = root.querySelector('#videos-title');
  const statusEl = root.querySelector('#videos-status');
  const tableEl = root.querySelector('#videos-table');
  const listEl = root.querySelector('#video-list');

  /**
   * Creates one cell of a row; textContent avoids injection attacks.
   */
  function createCell(text) {
    const cell = root.createElement('span');
    cell.textContent = text;
    return cell;
  }

  /**
   * Creates one row for a video.
   */
  function createRow(video) {
    const row = root.createElement('li');
    row.className = video.available ? 'video-row' : 'video-row unavailable';

    const title = root.createElement('span');
    if (video.available) {
      // Only link videos that can be opened; encodeURIComponent keeps the URL well-formed
      const link = root.createElement('a');
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = video.title;
      title.append(link);
    } else {
      title.textContent = video.title;
    }

    row.append(
      title,
      createCell(video.uploader ?? '—'),
      createCell(formatDate(video.uploadedAt)),
      createCell(formatDuration(video.durationSeconds)),
    );
    return row;
  }

  // Return interface functions
  return {
    /**
     * Shows the section for a playlist whose videos are being fetched.
     * 
     * @param {string} playlistTitle
     */
    showLoading(playlistTitle) {
      section.hidden = false;
      titleEl.textContent = playlistTitle;
      tableEl.hidden = true;
      listEl.replaceChildren();
      statusEl.textContent = 'Loading videos…';
    },

    /**
     * Shows how many videos have been fetched so far.
     * 
     * @param {number} loaded
     * @param {number|null} total null if unknown
     */
    showProgress(loaded, total) {
      const of = total ? ` of ${formatCount(total)}` : '';
      statusEl.textContent = `Loading videos… ${formatCount(loaded)}${of} (the list appears when loading finishes)`;
    },

    /**
     * Shows every video in one list.
     * 
     * @param {string} playlistTitle
     * @param {Array<object>} videos
     */
    showVideos(playlistTitle, videos) {
      section.hidden = false;
      titleEl.textContent = playlistTitle;

      if (videos.length === 0) {
        tableEl.hidden = true;
        listEl.replaceChildren();
        statusEl.textContent = 'This playlist is empty.';
        return;
      }

      // Build all rows off-screen, then add them in one step
      const fragment = root.createDocumentFragment();
      for (const video of videos) fragment.append(createRow(video));
      listEl.replaceChildren(fragment);
      tableEl.hidden = false;

      const unavailable = videos.filter((video) => !video.available).length;
      const note = unavailable > 0 ? ` (${formatCount(unavailable)} unavailable: likely private or deleted)` : '';
      statusEl.textContent = `${formatCount(videos.length)} videos${note}. Press Ctrl+F (Cmd+F on Mac) to search this list.`;
    },

    /**
     * Shows a failure message in place of the list.
     * 
     * @param {string} message
     */
    showError(message) {
      section.hidden = false;
      tableEl.hidden = true;
      listEl.replaceChildren();
      statusEl.textContent = message;
    },

    /**
     * Hides the section and forgets its contents (e.g. on sign-out).
     */
    hide() {
      listEl.replaceChildren();
      titleEl.textContent = '';
      statusEl.textContent = '';
      tableEl.hidden = true;
      section.hidden = true;
    },
  };
}