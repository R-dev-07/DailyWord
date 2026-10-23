import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';
import { installFromRaw, versionSizeBytes, versionUrl } from './versionInstaller';
import { translationIdFor } from './versions';

export type JobStatus = 'downloading' | 'paused' | 'saving' | 'error';
export type DownloadJob = {
  abbreviation: string;
  name: string;
  status: JobStatus;
  /** Bytes received so far, and the expected total. */
  received: number;
  total: number;
  /** 0..1 while saving into the local database. */
  saved: number;
  error?: string;
};

type DownloadState = {
  jobs: Record<string, DownloadJob>;
  /** Increments whenever a version finishes installing, so screens know to refresh their lists. */
  installedTick: number;
  start: (abbreviation: string, name: string) => void;
  pause: (abbreviation: string) => void;
  resume: (abbreviation: string) => void;
  cancel: (abbreviation: string) => void;
  dismiss: (abbreviation: string) => void;
};

// Native handles live outside the store because they are not serialisable state.
const resumables = new Map<string, FileSystem.DownloadResumable>();
const runIds = new Map<string, number>();
let saveQueue: Promise<unknown> = Promise.resolve();

const fileFor = (abbreviation: string) => `${FileSystem.cacheDirectory}bible-${abbreviation}.json`;
const message = (error: unknown) => (error instanceof Error ? error.message : 'The download failed. Check your connection and try again.');

export const useDownloads = create<DownloadState>((set, get) => {
  const patch = (abbreviation: string, change: Partial<DownloadJob>) =>
    set((state) => (state.jobs[abbreviation] ? { jobs: { ...state.jobs, [abbreviation]: { ...state.jobs[abbreviation], ...change } } } : state));
  const remove = (abbreviation: string) => set((state) => { const jobs = { ...state.jobs }; delete jobs[abbreviation]; return { jobs }; });
  const cleanup = async (abbreviation: string) => { resumables.delete(abbreviation); await FileSystem.deleteAsync(fileFor(abbreviation), { idempotent: true }).catch(() => undefined); };
  const status = (abbreviation: string) => get().jobs[abbreviation]?.status;

  /** Runs after the file has fully downloaded: validate and store it. Saves are serialised, so only one writes at a time. */
  const saveToDatabase = (abbreviation: string, runId: number) => {
    patch(abbreviation, { status: 'saving', saved: 0 });
    saveQueue = saveQueue.then(async () => {
      if (runIds.get(abbreviation) !== runId) return;
      try {
        const raw = await FileSystem.readAsStringAsync(fileFor(abbreviation));
        await installFromRaw(abbreviation, raw, (done, total) => patch(abbreviation, { saved: done / Math.max(1, total) }));
        await cleanup(abbreviation);
        remove(abbreviation);
        set((state) => ({ installedTick: state.installedTick + 1 }));
      } catch (error) {
        await cleanup(abbreviation);
        patch(abbreviation, { status: 'error', error: message(error) });
      }
    });
  };

  const transfer = async (abbreviation: string, runId: number, mode: 'download' | 'resume') => {
    const handle = resumables.get(abbreviation);
    if (!handle) return;
    try {
      const result = mode === 'download' ? await handle.downloadAsync() : await handle.resumeAsync();
      if (runIds.get(abbreviation) !== runId || status(abbreviation) !== 'downloading') return; // paused or cancelled meanwhile
      if (!result || result.status < 200 || result.status >= 300) throw new Error(`Download failed${result ? ` (HTTP ${result.status})` : ''}. Check your connection and try again.`);
      saveToDatabase(abbreviation, runId);
    } catch (error) {
      if (runIds.get(abbreviation) !== runId || status(abbreviation) !== 'downloading') return; // an intentional pause or cancel surfaces as an error; ignore it
      if (mode === 'resume') { begin(abbreviation); return; } // some servers refuse to resume: start over once
      await cleanup(abbreviation);
      patch(abbreviation, { status: 'error', error: message(error) });
    }
  };

  const begin = (abbreviation: string) => {
    const runId = (runIds.get(abbreviation) ?? 0) + 1;
    runIds.set(abbreviation, runId);
    let lastUpdate = 0;
    const total = versionSizeBytes(abbreviation);
    const handle = FileSystem.createDownloadResumable(versionUrl(abbreviation), fileFor(abbreviation), {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const now = Date.now();
      if (now - lastUpdate < 120 || runIds.get(abbreviation) !== runId) return;
      lastUpdate = now;
      patch(abbreviation, { received: totalBytesWritten, total: totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : total });
    });
    resumables.set(abbreviation, handle);
    patch(abbreviation, { status: 'downloading', received: 0, total, error: undefined });
    void transfer(abbreviation, runId, 'download');
  };

  return {
    jobs: {},
    installedTick: 0,
    start: (abbreviation, name) => {
      const existing = get().jobs[abbreviation];
      if (existing && existing.status !== 'error') return;
      set((state) => ({ jobs: { ...state.jobs, [abbreviation]: { abbreviation, name, status: 'downloading', received: 0, total: versionSizeBytes(abbreviation), saved: 0 } } }));
      begin(abbreviation);
    },
    pause: (abbreviation) => {
      const handle = resumables.get(abbreviation);
      if (!handle || status(abbreviation) !== 'downloading') return;
      patch(abbreviation, { status: 'paused' }); // mark intent first so the interrupted transfer is not reported as a failure
      void handle.pauseAsync().catch(() => undefined);
    },
    resume: (abbreviation) => {
      const handle = resumables.get(abbreviation);
      if (!handle || status(abbreviation) !== 'paused') return;
      const runId = (runIds.get(abbreviation) ?? 0) + 1;
      runIds.set(abbreviation, runId);
      patch(abbreviation, { status: 'downloading', error: undefined });
      void transfer(abbreviation, runId, 'resume');
    },
    cancel: (abbreviation) => {
      const state = status(abbreviation);
      if (!state || state === 'saving') return;
      const handle = resumables.get(abbreviation);
      runIds.set(abbreviation, (runIds.get(abbreviation) ?? 0) + 1);
      remove(abbreviation);
      void (async () => { try { await handle?.cancelAsync(); } catch { /* already stopped */ } await cleanup(abbreviation); })();
    },
    dismiss: (abbreviation) => { if (status(abbreviation) === 'error') remove(abbreviation); },
  };
});

export const isInstalling = (abbreviation: string) => !!useDownloads.getState().jobs[abbreviation];
export { translationIdFor };
