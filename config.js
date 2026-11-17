/*
 * The client ID is a public identifier, not a secret (it is okay to commit to
 * a repository). Forks of this project must replace the client ID with one
 * from their own Google Cloud project (see README). Never use a client secret
 * (do not commit one to your fork, even if the repository is private).
 */
export const CLIENT_ID = '249879683722-f7dthkpqtu0t7211h4isgc9134mdbn26.apps.googleusercontent.com';

/*
 * The scope determines the access level requested from GIS to read/write user
 * data in YT. Read-only scope is enough for viewing/searching/exporting,
 * importing requires 'https://www.googleapis.com/auth/youtube'.
 * 
 * TO-DO: implement importing and update scope.
 */
export const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';