import { create } from 'zustand';
import { MemoryItem } from '../core/parser';
import { DownloadJob, DownloadProgress } from '../core/downloader';

export type AppPhase =
  | 'onboarding'
  | 'importing'
  | 'parsing'
  | 'ready'
  | 'downloading'
  | 'complete'
  | 'error';

export type ExportDestination = 'album' | 'camera-roll';

interface AppState {
  phase: AppPhase;
  memories: MemoryItem[];
  jobs: DownloadJob[];
  progress: DownloadProgress;
  error: string | null;
  cancelSignal: { cancelled: boolean };
  pendingFileUri: string | null;
  exportDestination: ExportDestination;

  setPhase: (phase: AppPhase) => void;
  setMemories: (memories: MemoryItem[]) => void;
  updateProgress: (progress: DownloadProgress, job: DownloadJob) => void;
  setError: (error: string) => void;
  cancelDownload: () => void;
  setPendingFileUri: (uri: string | null) => void;
  setExportDestination: (dest: ExportDestination) => void;
  reset: () => void;
}

const initialProgress: DownloadProgress = { total: 0, saved: 0, failed: 0, active: 0 };

export const useStore = create<AppState>((set, get) => ({
  phase: 'onboarding',
  memories: [],
  jobs: [],
  progress: initialProgress,
  error: null,
  cancelSignal: { cancelled: false },
  pendingFileUri: null,
  exportDestination: 'album',

  setPhase: (phase) => set({ phase }),

  setMemories: (memories) => {
    // V1: $0.99 paid upfront — no tier limit, everyone gets full access
    const jobs: DownloadJob[] = memories.map((memory, index) => ({
      memory,
      index,
      status: 'pending',
    }));
    set({ memories, jobs, phase: 'ready' });
  },

  updateProgress: (progress, updatedJob) =>
    set((state) => ({
      progress,
      jobs: state.jobs.map((j) =>
        j.index === updatedJob.index ? { ...j, ...updatedJob } : j
      ),
    })),

  setError: (error) => set({ error, phase: 'error' }),

  cancelDownload: () => {
    get().cancelSignal.cancelled = true;
  },

  setPendingFileUri: (pendingFileUri) => set({ pendingFileUri }),

  setExportDestination: (exportDestination) => set({ exportDestination }),

  reset: () =>
    set({
      phase: 'onboarding',
      memories: [],
      jobs: [],
      progress: initialProgress,
      error: null,
      cancelSignal: { cancelled: false },
      pendingFileUri: null,
    }),
}));
