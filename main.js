/**
 * Composition root: the only file that sees every architecture layer.
 * Initialize view components using factories and connect them inside the app
 * controller component. Services created in this layer should only be created
 * using a factory. No logic implementation, app or view control in this layer.
 */
import { createApp } from './app.js';
import { createAuthView } from './ui/authView.js';
import { createPlaylistListView } from './ui/playlistListView.js';
import { createVideoListView } from './ui/videoListView.js';
import { createPlaylistService } from './services/playlistService.js';

/**
 * Creates app controller after browser window is loaded (ensures async Google
 * script component is finished loading for view components with dependencies).
 */
window.addEventListener('load', () => {
  // Create view components as members of an object using factories
  const views = {
    auth: createAuthView(document),
    playlists: createPlaylistListView(document),
    videos: createVideoListView(document),
  };

  // Create stateful services as members of an object using factories
  const services = {
    playlists: createPlaylistService(),
  };

  // Create app controller and pass view components, services to connect them; start app
  createApp({ views, services }).start();
});