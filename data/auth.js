/**
 * Logic: GIS and OAuth logic implementation only. Hand-off app details to GIS
 * and receive access token from OAuth. Forget access token to revoke API
 * access on sign-out. No app, view control in this layer.
 */
import { CLIENT_ID, SCOPES } from '../config.js';

let tokenClient = null;       // response from GIS: used to refresh accessToken
let accessToken = null;       // token used for YT API access, handed from tokenClient
let expiresAt = 0;            // time (ms) until accessToken expires

/**
 * Checks if the GIS script has loaded with the webpage.
 */
export function isAuthLibraryLoaded() {
  return typeof google !== 'undefined' && Boolean(google.accounts?.oauth2);
}

/**
 * Hands settings, callback functions to GIS for OAuth and initializes
 * tokenClient; call once after window has loaded.
 * 
 * @param {Function} onSignedIn updates DOM upon successful GIS response (with
 *                              no errors)
 * @param {Function} onError updates DOM upon failed GIS response (response
 *                           may report error)
 */
export function initAuth(onSignedIn, onError) {
  /*
   * Settings, callback functions handed to GIS as an object; receive
   * tokenClient.
   * 
   * GIS expects an object with four fields:
   *    - client_id: client ID from Google Cloud project
   *    - scope: access scope used for YT API
   *    - callback: called when GIS responds to request for tokenClient; may
   *      carry error (access_denied)
   *    - error_callback: called when GIS fails to respond to request; carries
   *      error type (popup_closed)
   */
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    // Response received
    callback: (callbackResponse) => {
      // Check response for error (e.g. access_denied)
      if (callbackResponse.error) {
        onError(callbackResponse.error);
        return;
      }

      // Successful response
      accessToken = callbackResponse.access_token;
      expiresAt = Date.now() + Number(callbackResponse.expires_in) * 1000;
      onSignedIn();
    },
    // No response received
    error_callback: (callbackError) => {
      // Report failure type (e.g. popup_closed)
      onError(callbackError.type);
    },
  });
}

/**
 * Initiates OAuth request after tokenClient received from GIS; initializes
 * accessToken. Call from a click handler, or the browser may block the popup.
 */
export function signIn() {
  tokenClient.requestAccessToken();
}

/**
 * Checks if accessToken was provided by OAuth request and is not expired;
 * return boolean.
 */
export function isSignedIn() {
  // Never send accessToken about to expire (60-second window)
  return accessToken !== null && Date.now() < expiresAt - 60_000;
}

/**
 * Returns accessToken if OAuth request was successful and is not expired.
 */
export function getToken() {
  return isSignedIn() ? accessToken : null;
}

/**
 * Forgets accessToken and forcefully expires timer; tokenClient grant is not
 * revoked (e.g. in case of 401 error).
 */
export function expireToken() {
  accessToken = null;
  expiresAt = 0;
}

/**
 * Ends the session and revokes API access.
 */
export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
  expireToken();
}