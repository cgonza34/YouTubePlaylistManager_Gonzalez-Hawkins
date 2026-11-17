/**
 * Logic: YT account-related API processing logic only. Translates raw API
 * shapes into a model that can be used by the view control. The presentation
 * layer cannot see the details of API requests/responses, only the processed
 * results from these files (services). No app, view control in this layer.
 */
import { fetchMyChannel } from '../data/api.js';

/**
 * Promises to convert user's channel summary from json to a boolean, string
 * channel title (only if channel exists).
 * 
 * @returns {Promise<{hasChannel: false} | {hasChannel: true, channelTitle: string}>}
 */
export async function getAccountSummary() {
  const channel = await fetchMyChannel();
  if (!channel) return { hasChannel: false };
  return { hasChannel: true, channelTitle: channel.snippet.title };
}