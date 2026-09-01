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
// From E39 onward the show dropped the season prefix: titles are now
// "E45 - ...", not "S3 E15 - ...". Anchored to the start so a stray "E12"
// mid-title cannot be mistaken for an episode number.
const BARE_EPISODE_RE = /^E\s*(\d+)\b/i;

export function episodeCodeFromTitle(title: string): string | undefined {
  const se = title.match(SEASON_EPISODE_RE);
  if (se) return `S${Number(se[1])}E${Number(se[2])}`;
  const be = title.trim().match(BARE_EPISODE_RE);
  if (be) return `E${Number(be[1])}`;
  return undefined;
}

interface YTPlaylistItem {
  snippet?: {
    title?: string;
    resourceId?: { videoId?: string };
  };
}

export interface LatestChannelVideos {
  fullVideoId?: string;
  shorts: Array<{ id: string; title: string }>;
}

function durationSeconds(value = ''): number {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
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
        const code = episodeCodeFromTitle(title);
        if (!code) continue;
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

export async function getLatestChannelVideos(): Promise<LatestChannelVideos> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { shorts: [] };

  try {
    const ch = await ytFetch<any>(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${key}`
    );
    const uploadsId = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error('uploads playlist id not found');

    const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    playlistUrl.searchParams.set('part', 'snippet');
    playlistUrl.searchParams.set('playlistId', uploadsId);
    playlistUrl.searchParams.set('maxResults', '25');
    playlistUrl.searchParams.set('key', key);
    const playlist = await ytFetch<any>(playlistUrl.toString());
    const uploads = (playlist?.items ?? [])
      .map((item: YTPlaylistItem) => ({
        id: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title ?? 'The Digital Dilemma video',
      }))
      .filter((video: { id?: string }) => Boolean(video.id));

    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails');
    detailsUrl.searchParams.set('id', uploads.map((video: { id: string }) => video.id).join(','));
    detailsUrl.searchParams.set('key', key);
    const details = await ytFetch<any>(detailsUrl.toString());
    const durations = new Map<string, number>(
      (details?.items ?? []).map((item: any) => [item.id, durationSeconds(item.contentDetails?.duration)])
    );

    const shorts = uploads
      .filter((video: { id: string; title: string }) => {
        const duration = durations.get(video.id) ?? 0;
        return /#shorts?\b/i.test(video.title) || (duration > 0 && duration <= 180);
      })
      .slice(0, 2);
    const fullVideoId = uploads.find(
      (video: { id: string; title: string }) => !/#shorts?\b/i.test(video.title) && (durations.get(video.id) ?? 0) > 180
    )?.id;

    return { fullVideoId, shorts };
  } catch (e) {
    console.warn('[youtube] latest video lookup failed:', (e as Error)?.message ?? e);
    return { shorts: [] };
  }
}
