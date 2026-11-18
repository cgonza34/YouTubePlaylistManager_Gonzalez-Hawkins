/**
 * App controller: flow control only. Connect view components when app
 * controller is created (view components are connected as members of an
 * object). Connect services by importing their functions. Determine the flow
 * of app events and communicate them to view components, services by calling
 * their functions, but never implement them. No view control, logic
 * implementation in this layer.
 */
import { initAuth, signIn, signOut, isAuthLibraryLoaded } from './data/auth.js';
import { getAccountSummary } from './services/accountService.js';
import { AuthError } from './errors.js';

/**
 * Checks if an error came from cancelling a load (see AbortController).
 * Cancelled loads are expected, not failures to show the user.
 * 
 * @param {Error} err
 */
function isAbortError(err) {
  return err?.name === 'AbortError';
}

/**
 * Creates the app controller and starts control flow. Functions handle events
 * by binding logic to DOM elements and updating view controls.
 * 
 * @param {object} deps
 * @param {object} deps.views members are objects with functions that control views
 * @param {object} deps.services members are stateful services
 * @returns {object} members are interface functions that can be used by the
 *                   composition root
 */
export function createApp({ views, services }) {
  // One AbortController per load in progress; aborting one cancels that load
  let playlistsLoad = null;
  let videosLoad = null;

  /**
   * Cancels loads still in progress so late results never reach the screen
   * (e.g. user selects another playlist, signs out).
   */
  function cancelLoads() {
    playlistsLoad?.abort();
    videosLoad?.abort();
    playlistsLoad = null;
    videosLoad = null;
  }

  /**
   * Forgets everything loaded for the current user: cancel loads, clear
   * cached data (it may be private), hide data views.
   */
  function resetData() {
    cancelLoads();
    services.playlists.clear();
    views.playlists.hide();
    views.videos.hide();
  }

  /**
   * Handles sign-in event: update view controls (sign-in confirmed), use access
   * token from successful OAuth request to establish connection with YT
   * account, then load the account's playlists.
   */
  async function handleSignedIn() {
    resetData();        // a new sign-in always starts with a clean screen
    views.auth.showChecking();

    // Await connection (channel, no channel, failure)
    let account;
    try {
      account = await getAccountSummary();
    } catch (err) {
      handleFailure(err);
      return;
    }

    if (!account.hasChannel) {
      views.auth.showNoChannel();
      return;
    }
    views.auth.showConnected(account.channelTitle);
    await loadPlaylists();
  }

  /**
   * Loads the user's playlists and updates the playlist view control.
   */
  async function loadPlaylists() {
    const load = new AbortController();
    playlistsLoad = load;

    views.playlists.showLoading();
    try {
      const playlists = await services.playlists.getPlaylists({ signal: load.signal });
      if (load.signal.aborted) return;
      views.playlists.showPlaylists(playlists);
    } catch (err) {
      if (isAbortError(err)) return;
      reportLoadError(err, views.playlists);
    }
  }

  /**
   * Handles playlist-selected event: cancel any video load in progress, load
   * the playlist's videos (reporting progress), update the video view control.
   * 
   * @param {{id: string, title: string}} playlist
   */
  async function handlePlaylistSelected(playlist) {
    videosLoad?.abort();
    const load = new AbortController();
    videosLoad = load;

    views.videos.showLoading(playlist.title);
    try {
      const videos = await services.playlists.loadVideos(playlist.id, {
        signal: load.signal,
        onProgress: (loaded, total) => views.videos.showProgress(loaded, total),
      });
      if (load.signal.aborted) return;
      views.videos.showVideos(playlist.title, videos);
    } catch (err) {
      if (isAbortError(err)) return;
      reportLoadError(err, views.videos);
    }
  }

  /**
   * Handles a failed load: an expired session ends the session, anything else
   * is shown by the view that was loading.
   * 
   * @param {Error} err
   * @param {{showError: (message: string) => void}} view
   */
  function reportLoadError(err, view) {
    if (err instanceof AuthError) {
      handleFailure(err);
    } else {
      view.showError(err.message);
    }
  }

  /**
   * Handles YT account connection failure: check failure type and update view
   * control (expired session, failure).
   * 
   * @param {Error} err 
   */
  function handleFailure(err) {
    if (err instanceof AuthError) {
      resetData();
      views.auth.showSignedOut('Your session expired. Please sign in again.');
    } else {
      views.auth.showError(err.message);
    }
  }

  /**
   * Handles failed OAuth access token request: update view control (failure).
   * 
   * @param {string} reason 
   */
  function handleAuthError(reason) {
    views.auth.showError(`Sign-in failed: ${reason}`);
  }

  /**
   * Handles sign-out event: forget tokens and loaded data, update view control
   * (confirm sign-out).
   */
  function handleSignOutClick() {
    signOut();
    resetData();
    views.auth.showSignedOut();
  }

  /**
   * Starts control flow. Bind logic implementation to DOM elements by passing
   * functions to view components. Wait for events.
   */
  function start() {
    // Bind GIS, OAuth elements (clicking triggers sign-in, sign-out events)
    views.auth.bind({
      onSignIn: () => signIn(),
      onSignOut: handleSignOutClick,
    });

    // Bind playlist list (clicking a playlist triggers playlist-selected event)
    views.playlists.bind({ onSelect: handlePlaylistSelected });

    // Update view control (login unavailable) if GIS script did not load with webpage
    if (!isAuthLibraryLoaded()) {
      views.auth.showUnavailable();
      return;
    }

    // Pass sign-in, error handling to GIS and update view control (login ready)
    // handleSignedIn is called by GIS after the user clicks, finishes OAuth sign-in
    initAuth(handleSignedIn, handleAuthError);
    views.auth.showReady();
  }

  // Return interface functions
  return { start };
}