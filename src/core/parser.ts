// Parses memories_history.json exported from Snapchat's "My Data" page.
// Snapchat wraps media in a "Saved Media" array. Each item has a date string,
// media type, and a pre-signed AWS S3 URL that expires ~7 days after export.

export type MediaType = 'PHOTO' | 'VIDEO';

export interface MemoryItem {
  date: Date;
  rawDate: string;
  mediaType: MediaType;
  downloadLink: string;
  location?: { latitude: number; longitude: number };
}

export interface ParseResult {
  memories: MemoryItem[];
  skipped: number;
}

interface RawMemory {
  Date?: string;
  'Media Type'?: string;
  'Download Link'?: string;
  Location?: {
    Latitude?: string;
    Longitude?: string;
  };
}

export function parseMemoriesJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON — make sure you selected memories_history.json');
  }

  const root = parsed as Record<string, unknown>;
  const savedMedia = root['Saved Media'];

  if (!Array.isArray(savedMedia)) {
    throw new Error('Unexpected format — "Saved Media" array not found');
  }

  const memories: MemoryItem[] = [];
  let skipped = 0;

  for (const item of savedMedia as RawMemory[]) {
    const link = item['Download Link'];
    const rawDate = item['Date'];
    const rawType = item['Media Type'];

    if (!link || !rawDate || !rawType) {
      skipped++;
      continue;
    }

    const mediaType = rawType.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'PHOTO';

    let date: Date;
    try {
      // Snapchat format: "2023-01-15 14:23:01 UTC"
      date = new Date(rawDate.replace(' UTC', 'Z').replace(' ', 'T'));
      if (isNaN(date.getTime())) throw new Error();
    } catch {
      date = new Date();
      skipped++;
    }

    const memory: MemoryItem = { date, rawDate, mediaType, downloadLink: link };

    if (item.Location?.Latitude && item.Location?.Longitude) {
      const lat = parseFloat(item.Location.Latitude);
      const lon = parseFloat(item.Location.Longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        memory.location = { latitude: lat, longitude: lon };
      }
    }

    memories.push(memory);
  }

  // Most recent first
  memories.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { memories, skipped };
}

export function generateFilename(memory: MemoryItem, index: number): string {
  const d = memory.date;
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const ext = memory.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
  return `snap_${datePart}_${String(index).padStart(5, '0')}.${ext}`;
}
