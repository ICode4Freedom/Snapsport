import { create } from 'zustand';
import { MemoryItem } from '../core/parser';
import { DownloadJob, DownloadProgress } from '../core/downloader';

export const FREE_TIER_LIMIT = 50;

export type AppPhase =
  | 'onboarding'
  | 'importing'
  | 'scanning'
  | 'ready'
  | 'saving'
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
  isPurchased: boolean;
  debugMode: boolean;
  extractedDirs: string[];

  setPhase: (phase: AppPhase) => void;
  setMemories: (memories: MemoryItem[]) => void;
  setExtractedDirs: (dirs: string[]) => void;
  updateProgress: (progress: DownloadProgress, job: DownloadJob) => void;
  setError: (error: string) => void;
  cancelDownload: () => void;
  setPendingFileUri: (uri: string | null) => void;
  setExportDestination: (dest: ExportDestination) => void;
  setPurchased: (v: boolean) => void;
  setDebugMode: (v: boolean) => void;
  setProgress: (progress: DownloadProgress) => void;
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
  isPurchased: false,
  debugMode: false,
  extractedDirs: [],

  setPhase: (phase) => set({ phase }),

  setMemories: (memories) => {
    const jobs: DownloadJob[] = memories.map((memory, index) => ({
      memory,
      index,
      status: 'pending',
    }));
    set({ memories, jobs, phase: 'ready' });
  },

  setExtractedDirs: (extractedDirs) => set({ extractedDirs }),

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

  setPurchased: (isPurchased) => set({ isPurchased }),

  setDebugMode: (debugMode) => set({ debugMode }),

  setProgress: (progress) => set({ progress }),

  reset: () =>
    set({
      phase: 'onboarding',
      memories: [],
      jobs: [],
      progress: initialProgress,
      error: null,
      cancelSignal: { cancelled: false },
      pendingFileUri: null,
      debugMode: false,
      extractedDirs: [],
      // isPurchased intentionally NOT reset — RevenueCat re-checks on startup
    }),
}));
