// The client ID is a public identifier, not a secret, so it is fine to commit.
// Forks of this project must replace it with their own Google Cloud client ID.
// NEVER put a client secret in this repo.
export const CLIENT_ID = '249879683722-f7dthkpqtu0t7211h4isgc9134mdbn26.apps.googleusercontent.com';

// Read-only is enough for viewing/searching/exporting.
// Importing later will need 'https://www.googleapis.com/auth/youtube'.
export const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';