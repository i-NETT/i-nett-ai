// Build-time YouTube video map for The Digital Dilemma.
//
// At build time, queries the YouTube Data API v3 for every "uploads" video on
// the channel and matches each one to a podcast episode by the "S{season}E{episode}"
// pattern in the title. Returns a { "S3E14": "videoId" } map.
//
// Behaves gracefully:
// - No YOUTUBE_API_KEY env var? Returns the manual fallback map.
// - API call fails or quota exhausted? Returns the manual fallback map.
// - Builds are deterministic given the same channel state and key.
//
// The API key is supplied via GitHub Actions secret YOUTUBE_API_KEY in CI;
// it is never committed to source.

import { PODCAST_VIDEOS_FALLBACK } from './podcastVideos';

const CHANNEL_ID = 'UCWcdscFXqBjRG838BAFGsUw'; // The Digital Dilemma Podcast
const SEASON_EPISODE_RE = /S\s*(\d+)\s*E\s*(\d+)/i;

interface YTPlaylistItem {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
  };
}

async function ytFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

let cached: Record<string, string> | null = null;

export async function buildVideoMap(): Promise<Record<string, string>> {
  if (cached) return cached;

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.log('[youtube] YOUTUBE_API_KEY not set, using fallback map');
    cached = { ...PODCAST_VIDEOS_FALLBACK };
    return cached;
  }

  try {
    // Step 1: resolve the channel's "uploads" playlist id.
    const ch = await ytFetch<any>(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${key}`
    );
    const uploadsId = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error('uploads playlist id not found');

    // Step 2: page through every video in the uploads playlist.
    const map: Record<string, string> = { ...PODCAST_VIDEOS_FALLBACK };
    let pageToken: string | undefined;
    let pages = 0;
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', uploadsId);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', key);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const page = await ytFetch<any>(url.toString());
      const items: YTPlaylistItem[] = page?.items ?? [];

      for (const it of items) {
        const title = it.snippet?.title ?? '';
        const videoId = it.snippet?.resourceId?.videoId;
        if (!videoId) continue;
        // Skip obvious shorts (we want long-form episodes only).
        if (/#shorts?\b/i.test(title)) continue;
        const m = title.match(SEASON_EPISODE_RE);
        if (!m) continue;
        const code = `S${Number(m[1])}E${Number(m[2])}`;
        // First match wins. Channels often have a duplicate upload; the older
        // (later in the uploads list, but iterated first because uploads are
        // newest-first) is usually the canonical one, but we trust the order.
        if (!map[code]) map[code] = videoId;
      }

      pageToken = page?.nextPageToken;
      pages++;
      if (pages > 30) break; // 30 * 50 = 1,500 video safety cap
    } while (pageToken);

    console.log(`[youtube] mapped ${Object.keys(map).length} episodes via YouTube Data API`);
    cached = map;
    return map;
  } catch (e) {
    console.warn('[youtube] API call failed, using fallback map:', (e as Error)?.message ?? e);
    cached = { ...PODCAST_VIDEOS_FALLBACK };
    return cached;
  }
}
