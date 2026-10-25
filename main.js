import { initAuth, signIn, signOut } from './auth.js';
import { fetchMyChannel } from './api.js';

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const statusEl = document.getElementById('status');

// textContent (never innerHTML): anything from YouTube is untrusted text.
function setStatus(message) {
  statusEl.textContent = message;
}

async function handleSignedIn() {
  loginBtn.hidden = true;
  logoutBtn.hidden = false;
  setStatus('Signed in. Checking YouTube connection…');
  try {
    const channel = await fetchMyChannel();
    setStatus(
      channel
        ? `Connected as ${channel.snippet.title}`
        : 'Signed in, but this Google account has no YouTube channel.'
    );
  } catch (err) {
    setStatus(err.message);
  }
}

function handleAuthError(reason) {
  setStatus(`Sign-in failed: ${reason}`);
}

function handleSignOut() {
  signOut();
  loginBtn.hidden = false;
  logoutBtn.hidden = true;
  setStatus('Signed out.');
}

// The window "load" event waits for the async Google script, so `google` exists here.
window.addEventListener('load', () => {
  initAuth(handleSignedIn, handleAuthError);
  loginBtn.disabled = false;
  setStatus('Ready. Click "Sign in with Google".');
});

loginBtn.addEventListener('click', signIn);
logoutBtn.addEventListener('click', handleSignOut);