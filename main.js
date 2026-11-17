/**
 * Composition root: the only file that sees every architecture layer.
 * Initialize view components using factories and connect them inside the app
 * controller component. Services created in this layer should only be created
 * using a factory. No logic implementation, app or view control in this layer.
 */
import { createApp } from './app.js';
import { createAuthView } from './ui/authView.js';

/**
 * Creates app controller after browser window is loaded (ensures async Google
 * script component is finished loading for view components with dependencies).
 */
window.addEventListener('load', () => {
  // Create view components as members of an object using factories
  const views = {
    auth: createAuthView(document),
  };

  // Create app controller and pass view components to connect them; start app
  createApp({ views }).start();
});