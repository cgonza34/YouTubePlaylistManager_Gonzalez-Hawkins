/**
 * Presentation: GIS and OAuth view control only. The flow control layer passes
 * logic implmentation to this layer by binding functions to DOM elements.
 * Listen for DOM events and call logic implementation, but never implement it.
 * No app control, logic implementation in this layer.
 */

/**
 * Creates the view control and listens for auth-related DOM events.
 * 
 * @param {Document} root the global HTML object
 * @return {object} members are interface funtions that can be called by the
 *                  app controller
 */
export function createAuthView(root = document) {
  // Select auth-related DOM elements
  const loginBtn = root.querySelector('#login-btn');
  const logoutBtn = root.querySelector('#logout-btn');
  const statusEl = root.querySelector('#status');

  /**
   * Updates auth-related DOM elements.
   * 
   * @param {object} elements DOM elements selected from root HTML
   */
  function render({ status, login, logout, canLogin = true }) {
    statusEl.textContent = status;      // textContent avoids injection attacks
    loginBtn.hidden = !login;
    loginBtn.disabled = !canLogin;
    logoutBtn.hidden = !logout;
  }

  // Return interface functions
  return {
    /**
     * Binds sign-in, -out logic implementation to sign-in, -out DOM elements.
     */
    bind({ onSignIn, onSignOut }) {
      loginBtn.addEventListener('click', () => onSignIn());
      logoutBtn.addEventListener('click', () => onSignOut());
    },

    /**
     * Shows GIS unavailable (e.g. the script did not load with browser).
     */
    showUnavailable() {
      render({
        status: 'Could not load Google sign-in. Check your connection or content blocker, then reload.',
        login: true,
        canLogin: false,
        logout: false,
      });
    },

    /**
     * Shows GIS available and prompts login.
     */
    showReady() {
      render({ status: 'Ready. Click "Sign in with Google".', login: true, logout: false });
    },

    /**
     * Shows OAuth request success and attempting to connect to YT.
     */
    showChecking() {
      render({ status: 'Signed in. Checking YouTube connection…', login: false, logout: true });
    },

    /**
     * Shows YT connection success.
     * 
     * @param {string} channelTitle user's channel
     */
    showConnected(channelTitle) {
      render({ status: `Connected as ${channelTitle}.`, login: false, logout: true });
    },

    /**
     * Shows OAuth request success but YT connection failure (no channel).
     */
    showNoChannel() {
      render({
        status: 'Signed in, but this Google account has no YouTube channel.',
        login: false,
        logout: true,
      });
    },

    /**
     * Shows sign-out success (e.g. user-prompted, connection expired).
     * 
     * @param {string} message sign-out confirmation message with reason
     */
    showSignedOut(message = 'Signed out.') {
      render({ status: message, login: true, logout: false });
    },

    /**
     * Shows a status message without changing which buttons are available.
     * Converts common auth errors (e.g. popup_closed due to browser blocking
     * popups) into helpful messages.
     * 
     * @param {string} reason auth error type (e.g. popup_closed); chosen by
     *                        GIS
     */
    showError(reason) {
      const messages = {
        popup_closed: 'The sign-in window closed. If you just approved access, click "Sign in with Google" again to finish.',
        popup_failed_to_open: 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
      };
      statusEl.textContent = messages[reason] ?? `Sign-in failed: ${reason}`;
    },
  };
}