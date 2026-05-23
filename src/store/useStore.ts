import { create } from 'zustand';
import { MemoryItem } from '@/core/parser';
import { DownloadJob, DownloadProgress } from '@/core/downloader';

export type AppPhase =
  | 'onboarding'
  | 'importing'
  | 'parsing'
  | 'ready'        // parsed, waiting for user to confirm + pay
  | 'downloading'
  | 'complete'
  | 'error';

interface AppState {
  phase: AppPhase;
  memories: MemoryItem[];
  jobs: DownloadJob[];
  progress: DownloadProgress;
  error: string | null;
  isPurchased: boolean;
  cancelSignal: { cancelled: boolean };

  setPhase: (phase: AppPhase) => void;
  setMemories: (memories: MemoryItem[]) => void;
  setJobs: (jobs: DownloadJob[]) => void;
  updateProgress: (progress: DownloadProgress, job: DownloadJob) => void;
  setError: (error: string) => void;
  setPurchased: (v: boolean) => void;
  cancelDownload: () => void;
  reset: () => void;
}

const FREE_TIER_LIMIT = 50;

const initialProgress: DownloadProgress = { total: 0, saved: 0, failed: 0, active: 0 };

export const useStore = create<AppState>((set, get) => ({
  phase: 'onboarding',
  memories: [],
  jobs: [],
  progress: initialProgress,
  error: null,
  isPurchased: false,
  cancelSignal: { cancelled: false },

  setPhase: (phase) => set({ phase }),

  setMemories: (memories) => {
    const { isPurchased } = get();
    const limited = isPurchased ? memories : memories.slice(0, FREE_TIER_LIMIT);
    const jobs: DownloadJob[] = limited.map((memory, index) => ({
      memory,
      index,
      status: 'pending',
    }));
    set({ memories, jobs, phase: 'ready' });
  },

  setJobs: (jobs) => set({ jobs }),

  updateProgress: (progress, updatedJob) =>
    set((state) => ({
      progress,
      jobs: state.jobs.map((j) =>
        j.index === updatedJob.index ? { ...j, ...updatedJob } : j
      ),
    })),

  setError: (error) => set({ error, phase: 'error' }),

  setPurchased: (isPurchased) => {
    set({ isPurchased });
    // Expand job list to full library if they just purchased
    const { memories } = get();
    if (isPurchased && memories.length > FREE_TIER_LIMIT) {
      const jobs: DownloadJob[] = memories.map((memory, index) => ({
        memory,
        index,
        status: 'pending',
      }));
      set({ jobs });
    }
  },

  cancelDownload: () => {
    const { cancelSignal } = get();
    cancelSignal.cancelled = true;
  },

  reset: () =>
    set({
      phase: 'onboarding',
      memories: [],
      jobs: [],
      progress: initialProgress,
      error: null,
      cancelSignal: { cancelled: false },
    }),
}));

export { FREE_TIER_LIMIT };
