/**
 * Presentation: playlist list view control only. The flow control layer passes
 * logic implementation to this layer by binding a function; this layer
 * listens for DOM events and calls it, but never implements it. No app
 * control, logic implementation in this layer.
 */
import { formatCount } from './format.js';

/**
 * Creates the playlist list view control.
 * 
 * @param {Document} root the global HTML object
 * @returns {object} members are interface functions that can be called by the
 *                   app controller
 */
export function createPlaylistListView(root = document) {
  // Select playlist-related DOM elements
  const section = root.querySelector('#playlists-section');
  const statusEl = root.querySelector('#playlists-status');
  const listEl = root.querySelector('#playlist-list');

  let playlists = [];             // playlists on screen: maps a click back to a playlist
  let onSelect = () => {};        // set by bind()

  // One listener for the whole list (not one per button): works for any number of playlists
  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) return;

    // Mark only the clicked playlist as selected
    listEl.querySelector('button[aria-current]')?.removeAttribute('aria-current');
    button.setAttribute('aria-current', 'true');

    onSelect(playlists[Number(button.dataset.index)]);
  });

  function clear() {
    playlists = [];
    listEl.replaceChildren();
  }

  // Return interface functions
  return {
    /**
     * Binds the playlist-selected logic implementation to the list.
     * 
     * @param {object} handlers
     * @param {(playlist: {id: string, title: string, videoCount: number}) => void} handlers.onSelect
     */
    bind({ onSelect: handler }) {
      onSelect = handler;
    },

    /**
     * Shows the section while playlists are being fetched.
     */
    showLoading() {
      clear();
      section.hidden = false;
      statusEl.textContent = 'Loading playlists…';
    },

    /**
     * Shows one button per playlist.
     * 
     * @param {Array<{id: string, title: string, videoCount: number}>} items
     */
    showPlaylists(items) {
      clear();
      playlists = items;
      section.hidden = false;
      statusEl.textContent = items.length === 0 ? 'No playlists found.' : '';

      const fragment = root.createDocumentFragment();
      items.forEach((playlist, index) => {
        const item = root.createElement('li');
        const button = root.createElement('button');
        const count = root.createElement('span');

        button.type = 'button';
        button.dataset.index = String(index);
        button.textContent = playlist.title;          // textContent: titles are untrusted text
        count.className = 'count';
        count.textContent = ` (${formatCount(playlist.videoCount)})`;

        button.append(count);
        item.append(button);
        fragment.append(item);
      });
      listEl.replaceChildren(fragment);
    },

    /**
     * Shows a failure message in place of the list.
     * 
     * @param {string} message
     */
    showError(message) {
      clear();
      section.hidden = false;
      statusEl.textContent = message;
    },

    /**
     * Hides the section and forgets its contents (e.g. on sign-out).
     */
    hide() {
      clear();
      statusEl.textContent = '';
      section.hidden = true;
    },
  };
}