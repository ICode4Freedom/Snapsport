import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { MemoryItem, generateFilename } from './parser';
import { ExportDestination } from '../store/useStore';

export type DownloadStatus = 'pending' | 'downloading' | 'saved' | 'failed';

export interface DownloadJob {
  memory: MemoryItem;
  index: number;
  status: DownloadStatus;
  error?: string;
}

export interface DownloadProgress {
  total: number;
  saved: number;
  failed: number;
  active: number;
}

type ProgressCallback = (progress: DownloadProgress, job: DownloadJob) => void;

const CONCURRENCY = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function downloadOne(job: DownloadJob, tempDir: string, attempt = 1): Promise<string> {
  const filename = generateFilename(job.memory, job.index);
  const localUri = `${tempDir}${filename}`;

  const result = await FileSystem.downloadAsync(job.memory.downloadLink, localUri);

  if (result.status !== 200) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
      return downloadOne(job, tempDir, attempt + 1);
    }
    throw new Error(`HTTP ${result.status}`);
  }

  return localUri;
}

async function saveToLibrary(localUri: string, destination: ExportDestination): Promise<void> {
  const asset = await MediaLibrary.createAssetAsync(localUri);

  if (destination === 'album') {
    try {
      let album = await MediaLibrary.getAlbumAsync('SnapsPort');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('SnapsPort', asset, false);
      }
    } catch {
      // Asset is still saved to Camera Roll even if album creation fails
    }
  }
  // 'camera-roll' just uses createAssetAsync above — no album needed

  await FileSystem.deleteAsync(localUri, { idempotent: true });
}

export async function runDownloadQueue(
  jobs: DownloadJob[],
  destination: ExportDestination,
  onProgress: ProgressCallback,
  signal: { cancelled: boolean }
): Promise<DownloadProgress> {
  const tempDir = `${FileSystem.cacheDirectory}snapsport/`;
  await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

  const progress: DownloadProgress = {
    total: jobs.length,
    saved: 0,
    failed: 0,
    active: 0,
  };

  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      if (signal.cancelled) break;

      const job = jobs[cursor++];
      if (!job) break;

      job.status = 'downloading';
      progress.active++;
      onProgress({ ...progress }, { ...job });

      try {
        const localUri = await downloadOne(job, tempDir);
        await saveToLibrary(localUri, destination);
        job.status = 'saved';
        progress.saved++;
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Unknown error';
        progress.failed++;
      } finally {
        progress.active--;
        onProgress({ ...progress }, { ...job });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await FileSystem.deleteAsync(tempDir, { idempotent: true });

  return progress;
}
