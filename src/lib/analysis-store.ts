import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AtsResult } from "./resume/ats";
import type { JdMatch } from "./resume/jd-match";
import type { AiSuggestions } from "./ai/mistral";
import { useAuthStore } from "./auth-store";

export interface AnalysisRecord {
  id: string;
  userId: string;
  fileName: string;
  resumeText: string;
  jdText: string;
  ats: AtsResult;
  jd: JdMatch;
  ai: AiSuggestions | null;
  createdAt: number;
}

interface AnalysisState {
  /** All records across all local users. Consumers MUST filter by userId
   *  (use the useUserHistory / useUserCurrent hooks) — never render raw. */
  records: AnalysisRecord[];
  /** Per-user "currently open" record id. */
  currentByUser: Record<string, string | null>;
  aiLoading: boolean;
  setCurrent: (record: Omit<AnalysisRecord, "id" | "userId">) => void;
  setAi: (ai: AiSuggestions) => void;
  setAiLoading: (loading: boolean) => void;
  loadFromHistory: (id: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  clear: () => void;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function activeUserId(): string | null {
  return useAuthStore.getState().session?.userId ?? null;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      records: [],
      currentByUser: {},
      aiLoading: false,
      setCurrent: (record) => {
        const userId = activeUserId();
        if (!userId) return;
        const withId: AnalysisRecord = { ...record, id: newId(), userId };
        // Keep up to 25 records per user; keep other users' records intact.
        const mine = [withId, ...get().records.filter((r) => r.userId === userId)].slice(0, 25);
        const others = get().records.filter((r) => r.userId !== userId);
        set({
          records: [...mine, ...others],
          currentByUser: { ...get().currentByUser, [userId]: withId.id },
          aiLoading: false,
        });
      },
      setAi: (ai) =>
        set((s) => {
          const userId = activeUserId();
          if (!userId) return s;
          const currentId = s.currentByUser[userId];
          if (!currentId) return s;
          return {
            records: s.records.map((r) => (r.id === currentId ? { ...r, ai } : r)),
            aiLoading: false,
          };
        }),
      setAiLoading: (aiLoading) => set({ aiLoading }),
      loadFromHistory: (id) => {
        const userId = activeUserId();
        if (!userId) return;
        const found = get().records.find((r) => r.id === id && r.userId === userId);
        if (found) {
          set({
            currentByUser: { ...get().currentByUser, [userId]: found.id },
            aiLoading: false,
          });
        }
      },
      removeFromHistory: (id) =>
        set((s) => {
          const userId = activeUserId();
          if (!userId) return s;
          const nextCurrent = { ...s.currentByUser };
          if (nextCurrent[userId] === id) nextCurrent[userId] = null;
          return {
            records: s.records.filter((r) => !(r.id === id && r.userId === userId)),
            currentByUser: nextCurrent,
          };
        }),
      clearHistory: () =>
        set((s) => {
          const userId = activeUserId();
          if (!userId) return s;
          return {
            records: s.records.filter((r) => r.userId !== userId),
            currentByUser: { ...s.currentByUser, [userId]: null },
          };
        }),
      clear: () =>
        set((s) => {
          const userId = activeUserId();
          if (!userId) return { aiLoading: false };
          return {
            currentByUser: { ...s.currentByUser, [userId]: null },
            aiLoading: false,
          };
        }),
    }),
    {
      name: "resumate_analysis",
      version: 2,
      migrate: (persisted: unknown, version) => {
        // v1 shape: { history: AnalysisRecord[]; current: AnalysisRecord | null }
        // Discard legacy records that predate per-user scoping so one user's
        // history can't leak into another local account.
        if (version < 2) {
          return { records: [], currentByUser: {}, aiLoading: false } as Partial<AnalysisState>;
        }
        return persisted as Partial<AnalysisState>;
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (s) => ({ records: s.records, currentByUser: s.currentByUser }),
    },
  ),
);

/** History records for the currently signed-in user (newest first). */
export function useUserHistory(): AnalysisRecord[] {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const records = useAnalysisStore((s) => s.records);
  if (!userId) return [];
  return records.filter((r) => r.userId === userId);
}

/** Currently opened record for the signed-in user, if any. */
export function useUserCurrent(): AnalysisRecord | null {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const currentId = useAnalysisStore((s) => (userId ? s.currentByUser[userId] ?? null : null));
  const record = useAnalysisStore((s) =>
    currentId ? s.records.find((r) => r.id === currentId) ?? null : null,
  );
  return record;
}
