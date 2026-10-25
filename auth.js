import { CLIENT_ID, SCOPES } from './config.js';

// The access token lives only in memory: it is never written to
// localStorage/IndexedDB, and it disappears when the tab closes.
let accessToken = null;
let expiresAt = 0; // ms timestamp
let tokenClient = null;

/** Call once after the Google library has loaded. */
export function initAuth(onSignedIn, onError) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        onError(response.error);
        return;
      }
      accessToken = response.access_token;
      expiresAt = Date.now() + Number(response.expires_in) * 1000;
      onSignedIn();
    },
    // Fires when the popup is blocked or closed before finishing.
    error_callback: (err) => onError(err.type),
  });
}

/** Must be called from a click handler, or browsers may block the popup. */
export function signIn() {
  tokenClient.requestAccessToken();
}

export function isSignedIn() {
  // 60-second safety margin so we never send a token about to expire.
  return accessToken !== null && Date.now() < expiresAt - 60_000;
}

export function getToken() {
  return isSignedIn() ? accessToken : null;
}

/** Forget the token and revoke this app's access to the user's account. */
export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  expiresAt = 0;
}