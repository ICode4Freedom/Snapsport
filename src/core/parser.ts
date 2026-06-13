import * as FileSystem from 'expo-file-system';

export type MediaType = 'PHOTO' | 'VIDEO';

export interface MemoryItem {
  localPath: string;
  mediaType: MediaType;
  date: Date;
}

export interface ScanResult {
  memories: MemoryItem[];
  skipped: number;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.heic', '.png']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov']);
const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export async function scanMediaFiles(extractedDirs: string[]): Promise<ScanResult> {
  const memories: MemoryItem[] = [];
  let skipped = 0;

  for (const dir of extractedDirs) {
    const result = await walkDir(ensureTrailingSlash(dir));
    memories.push(...result.memories);
    skipped += result.skipped;
  }

  memories.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { memories, skipped };
}

async function walkDir(dir: string): Promise<ScanResult> {
  const memories: MemoryItem[] = [];
  let skipped = 0;

  let entries: string[];
  try {
    entries = await FileSystem.readDirectoryAsync(dir);
  } catch {
    return { memories, skipped };
  }

  for (const entry of entries) {
    const path = `${dir}${entry}`;
    const ext = getExtension(entry);

    if (MEDIA_EXTENSIONS.has(ext)) {
      const mediaType: MediaType = IMAGE_EXTENSIONS.has(ext) ? 'PHOTO' : 'VIDEO';
      const date = parseDateFromFilename(entry) ?? new Date();
      memories.push({ localPath: path, mediaType, date });
    } else if (!ext) {
      // Likely a directory — recurse
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.isDirectory) {
          const sub = await walkDir(`${path}/`);
          memories.push(...sub.memories);
          skipped += sub.skipped;
        }
      } catch {
        skipped++;
      }
    }
  }

  return { memories, skipped };
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

// Handles Snapchat export filenames like "2024-01-15 12-34-56 UTC.jpg"
// and common variants like "2024-01-15_12-34-56.jpg" or "20240115_123456.jpg"
function parseDateFromFilename(filename: string): Date | null {
  // "YYYY-MM-DD HH-MM-SS" or "YYYY-MM-DD_HH-MM-SS" or "YYYY-MM-DDTHH:MM:SS"
  const full = filename.match(/(\d{4})-(\d{2})-(\d{2})[\s_T](\d{2})[-:](\d{2})[-:](\d{2})/);
  if (full) {
    const [, y, mo, d, h, mi, s] = full;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // "YYYYMMDD_HHMMSS"
  const compact = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (compact) {
    const [, y, mo, d, h, mi, s] = compact;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // Fall back to date-only "YYYY-MM-DD"
  const dateOnly = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    const date = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}
