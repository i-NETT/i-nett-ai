import { buildVideoMap, episodeCodeFromTitle } from '@lib/youtubeMap';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import podcastFeedFallback from '../data/podcast-feed.xml?raw';

const FEED_URL = 'https://api.riverside.fm/hosting/QL16ouQn.rss';

export interface Episode {
  guid: string;
  season?: number;
  episode?: number;
  code?: string; // "S3E14"
  title: string; // cleaned, without the "S3 E14 - " prefix
  rawTitle: string;
  slug: string;
  pubDate: Date;
  durationText?: string;
  image?: string;
  audioUrl?: string;
  descriptionHtml: string;
  youtubeId?: string;
}

export interface EpisodeArtwork {
  cover: string;
  // null where no artwork file exists, so the template skips the figure
  // rather than rendering a 404 as a black box.
  supporting: Array<string | null>;
  coverAlt: string;
}

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const publicFileExists = (webPath: string): boolean => {
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, webPath.replace(/^\//, '')));
  } catch {
    return false;
  }
};

export function getEpisodeArtwork(ep: Episode): EpisodeArtwork {
  const base = `/images/podcast/${ep.slug}`;

  // Artwork is produced per episode by hand, so anything published since
  // the last run has no files at all. These paths were emitted regardless,
  // which is why a new episode showed four broken images. Fall back to the
  // YouTube thumbnail for the cover and drop the supporting art.
  const coverPath = `${base}/cover-editorial.webp`;
  const cover = publicFileExists(coverPath)
    ? coverPath
    : ep.youtubeId
      ? `https://i.ytimg.com/vi/${ep.youtubeId}/maxresdefault.jpg`
      : '/assets/brand/fortify-ai-logo-mark.png';

  const supporting = [1, 2, 3].map((n) => {
    const p = `${base}/support-${n}.webp`;
    return publicFileExists(p) ? p : null;
  });

  return { cover, supporting, coverAlt: `Editorial artwork for ${ep.title}` };
}

export function splitEpisodeNotes(html: string, sections = 3): string[] {
  const blocks = html.match(/<(?:p|h2|h3|ul|ol)[^>]*>[\s\S]*?<\/(?:p|h2|h3|ul|ol)>/gi);
  if (!blocks?.length) return [html];

  const result: string[] = [];
  const perSection = Math.ceil(blocks.length / sections);
  for (let i = 0; i < blocks.length; i += perSection) {
    result.push(blocks.slice(i, i + perSection).join(''));
  }
  return result;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}

function pick(block: string, re: RegExp): string | undefined {
  const m = block.match(re);
  return m ? m[1].trim() : undefined;
}

export async function getEpisodes(): Promise<Episode[]> {
  let xml = '';
  try {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'i-nett.ai-build' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`feed responded ${res.status}`);
    xml = await res.text();
  } catch (e) {
    console.warn('[podcast] live feed fetch failed, using the cached feed:', (e as Error)?.message ?? e);
    xml = podcastFeedFallback;
  }

  const videoMap = await buildVideoMap();
  const blocks = xml.split('<item>').slice(1).map((s) => s.split('</item>')[0]);
  const episodes: Episode[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const rawTitle = (
      pick(block, /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) ?? ''
    ).trim();
    if (!rawTitle) continue;

    const season = Number(pick(block, /<itunes:season>(\d+)<\/itunes:season>/)) || undefined;
    const episode = Number(pick(block, /<itunes:episode>(\d+)<\/itunes:episode>/)) || undefined;
    // Slug rules are FROZEN. They are reproduced here exactly as first
    // published, because anything else moves a live URL. Widening the code
    // below without this pinned first moved three of them: E42 gained a
    // "-day" once the prefix stopped eating the 80-character budget, and
    // S3E6/S3E3 gained an "s3e6-" prefix they never had.
    const slugCode = season && episode ? `S${season}E${episode}` : undefined;
    const slugTitle = rawTitle.replace(/^S\d+\s*E\d+\s*[-:–]\s*/i, '').trim();

    // The code is for the video lookup and the label only. The feed still
    // tags <itunes:episode> for the newer run but stopped sending
    // <itunes:season>; requiring both left E39-E45 with no code at all,
    // which skipped the YouTube lookup and left those pages audio-only.
    const code =
      slugCode
      ?? (episode ? `E${episode}` : episodeCodeFromTitle(rawTitle));

    // Display title drops whichever prefix it carries, so the heading does
    // not repeat the episode number the eyebrow already shows.
    const title = slugTitle.replace(/^E\d+\s*[-:–]\s*/i, '').trim();

    const pubRaw = pick(block, /<pubDate>([\s\S]*?)<\/pubDate>/);
    const pubDate = pubRaw ? new Date(pubRaw) : new Date(0);
    const durationText = pick(block, /<itunes:duration>([\s\S]*?)<\/itunes:duration>/);
    const image = pick(block, /<itunes:image[^>]*href="([^"]+)"/);
    const audioUrl = pick(block, /<enclosure[^>]*url="([^"]+)"/);
    const descriptionHtml =
      pick(block, /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ?? '';
    const guid = pick(block, /<guid[^>]*>([\s\S]*?)<\/guid>/) ?? audioUrl ?? rawTitle;

    let slug = slugCode ? `${slugCode.toLowerCase()}-${slugify(slugTitle)}` : slugify(slugTitle) || `episode-${episodes.length + 1}`;
    while (seen.has(slug)) slug = `${slug}-2`;
    seen.add(slug);

    episodes.push({
      guid,
      season,
      episode,
      code,
      title,
      rawTitle,
      slug,
      pubDate,
      durationText,
      image,
      audioUrl,
      descriptionHtml,
      youtubeId: code ? videoMap[code] : undefined,
    });
  }

  episodes.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  return episodes;
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
