// Auto-built episode -> YouTube video map.
//
// At build time, src/lib/youtubeMap.ts queries the YouTube Data API v3 for
// every "uploads" video on the Digital Dilemma channel, matches them to
// episodes by the "S{season}E{episode}" pattern in their titles, and produces
// this map. When the YOUTUBE_API_KEY env var is set in the build environment
// (GitHub Actions secret in CI), the map is built dynamically. Without it,
// the fallback below is used so the build never fails.
//
// Maintained manually as a safety net for episodes that were available before
// the API key was wired up, or any episode whose title does not include the
// canonical "S# E#" prefix.
export const PODCAST_VIDEOS_FALLBACK: Record<string, string> = {
  S3E14: 'IstQKqxCRQY',
};
