import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { MemoryItem } from './parser';
import { ExportDestination } from '../store/useStore';

export type DownloadStatus = 'pending' | 'saving' | 'saved' | 'failed';

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

async function saveToLibrary(localPath: string, destination: ExportDestination): Promise<void> {
  const asset = await MediaLibrary.createAssetAsync(localPath);

  if (destination === 'album') {
    try {
      const album = await MediaLibrary.getAlbumAsync('SnapsPort');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('SnapsPort', asset, false);
      }
    } catch {
      // Asset is still in Camera Roll even if album creation fails
    }
  }
}

export async function runDownloadQueue(
  jobs: DownloadJob[],
  destination: ExportDestination,
  onProgress: ProgressCallback,
  signal: { cancelled: boolean },
  cleanupPaths?: string[]
): Promise<DownloadProgress> {
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

      job.status = 'saving';
      progress.active++;
      onProgress({ ...progress }, { ...job });

      try {
        await saveToLibrary(job.memory.localPath, destination);
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

  if (cleanupPaths?.length) {
    await Promise.all(
      cleanupPaths.map((p) => FileSystem.deleteAsync(p, { idempotent: true }))
    );
  }

  return progress;
}
