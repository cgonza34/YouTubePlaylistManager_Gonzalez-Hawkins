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
 * Creates the app controller and starts control flow. Functions handle events
 * by binding logic to DOM elements and updating view controls.
 * 
 * @param {object} views members are objects with functions that control views
 * @returns {object} members are interface functions that can be used by the
 *                   composition root
 */
export function createApp({ views }) {
  /**
   * Handles sign-in event: update view controls (sign-in confirmed) and use
   * access token from successful OAuth request to establish connection with YT
   * account.
   */
  async function handleSignedIn() {
    // Update view control (checking YT connection)
    views.auth.showChecking();

    // Await connection and update view control (channel, no channel, failure)
    try {
      const account = await getAccountSummary();

      if (account.hasChannel) {
        views.auth.showConnected(account.channelTitle);
      } else {
        views.auth.showNoChannel();
      }

    } catch (err) {
      handleFailure(err);
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
      views.auth.showSignedOut('Your session expired. Please sign in again.');
    } else {
      views.auth.showError(err.message);
    }
  }

  /**
   * Handles failed OAuth access token request: update view control (failure).
   * 
   * @param {string} reason auth error type (e.g. popup_closed); chosen by GIS
   */
  function handleAuthError(reason) {
    views.auth.showError(reason);
  }

  /**
   * Handles sign-out event: forget tokens and update view control (confirm
   * sign-out).
   */
  function handleSignOutClick() {
    signOut();
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