import { buildVideoMap } from '@lib/youtubeMap';

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
    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'i-nett.ai-build' } });
    if (!res.ok) throw new Error(`feed responded ${res.status}`);
    xml = await res.text();
  } catch (e) {
    console.warn('[podcast] feed fetch failed, building with no episodes:', (e as Error)?.message ?? e);
    return [];
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
    const code = season && episode ? `S${season}E${episode}` : undefined;
    const title = rawTitle.replace(/^S\d+\s*E\d+\s*[-:–]\s*/i, '').trim();

    const pubRaw = pick(block, /<pubDate>([\s\S]*?)<\/pubDate>/);
    const pubDate = pubRaw ? new Date(pubRaw) : new Date(0);
    const durationText = pick(block, /<itunes:duration>([\s\S]*?)<\/itunes:duration>/);
    const image = pick(block, /<itunes:image[^>]*href="([^"]+)"/);
    const audioUrl = pick(block, /<enclosure[^>]*url="([^"]+)"/);
    const descriptionHtml =
      pick(block, /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ?? '';
    const guid = pick(block, /<guid[^>]*>([\s\S]*?)<\/guid>/) ?? audioUrl ?? rawTitle;

    let slug = code ? `${code.toLowerCase()}-${slugify(title)}` : slugify(title) || `episode-${episodes.length + 1}`;
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
