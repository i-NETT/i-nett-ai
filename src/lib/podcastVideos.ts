// Map of "S{season}E{episode}" -> YouTube video ID for The Digital Dilemma.
// When an episode has an entry here, its post embeds the YouTube video;
// otherwise it falls back to the audio player from the RSS feed.
//
// To auto-populate every episode (including future ones), add a YouTube Data
// API key and we can match by the "S# E#" title pattern at build time. Until
// then, add IDs here as episodes are published to YouTube.
export const PODCAST_VIDEOS: Record<string, string> = {
  S3E14: 'IstQKqxCRQY',
};
