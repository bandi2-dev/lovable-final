import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * DEMO AUTH — for local academic use only.
 * Stores users + sessions in localStorage. Passwords are hashed with
 * SHA-256 + per-user salt via Web Crypto. Do NOT reuse for production.
 */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  issuedAt: number;
}

interface AuthState {
  users: StoredUser[];
  session: Session | null;
  signup: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,
      async signup({ name, email, password }) {
        const normalized = email.trim().toLowerCase();
        if (get().users.some((u) => u.email === normalized)) {
          throw new Error("An account with this email already exists.");
        }
        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        const user: StoredUser = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: normalized,
          salt,
          passwordHash,
          createdAt: Date.now(),
        };
        set({
          users: [...get().users, user],
          session: {
            userId: user.id,
            email: user.email,
            name: user.name,
            issuedAt: Date.now(),
          },
        });
      },
      async login({ email, password }) {
        const normalized = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email === normalized);
        if (!user) throw new Error("No account found for that email.");
        const hash = await hashPassword(password, user.salt);
        if (hash !== user.passwordHash) throw new Error("Incorrect password.");
        set({
          session: {
            userId: user.id,
            email: user.email,
            name: user.name,
            issuedAt: Date.now(),
          },
        });
      },
      logout() {
        set({ session: null });
      },
    }),
    {
      name: "resume_analyzer_auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);

export function useHydratedAuth() {
  // Zustand persist rehydrates on the client — components should mount-check.
  return useAuthStore;
}
