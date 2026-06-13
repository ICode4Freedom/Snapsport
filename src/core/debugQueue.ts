import { DownloadJob, DownloadProgress } from './downloader';

type ProgressCallback = (progress: DownloadProgress, job: DownloadJob) => void;

const TOTAL_DURATION_MS = 5000;

export async function runDebugQueue(
  jobs: DownloadJob[],
  onProgress: ProgressCallback,
  signal: { cancelled: boolean }
): Promise<DownloadProgress> {
  const total = jobs.length;
  const progress: DownloadProgress = { total, saved: 0, failed: 0, active: 0 };
  const delayPerJob = TOTAL_DURATION_MS / total;

  for (const job of jobs) {
    if (signal.cancelled) break;

    job.status = 'saving';
    progress.active = Math.min(5, total - progress.saved - progress.failed);
    onProgress({ ...progress }, { ...job });

    await new Promise<void>((r) => setTimeout(r, delayPerJob));

    // Simulate ~4% failure rate so the failure stat is visible
    if (Math.random() < 0.04) {
      job.status = 'failed';
      job.error = '[debug] Simulated failure';
      progress.failed++;
    } else {
      job.status = 'saved';
      progress.saved++;
    }
    progress.active = Math.max(0, progress.active - 1);
    onProgress({ ...progress }, { ...job });
  }

  return progress;
}
