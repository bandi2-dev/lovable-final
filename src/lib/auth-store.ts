import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase, supabaseEnabled } from "@/integrations/supabase/client";

/**
 * AUTH STORE
 * Supports Supabase Auth (when enabled) with a local demo auth fallback.
 * Local fallback uses localStorage and Web Crypto to hash passwords.
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
         if (supabaseEnabled && supabase) {
           console.log("Supabase signup attempt with:", { email });

           const { data, error } = await supabase.auth.signUp({
             email,
             password,
             options: {
               data: {
                 name: name.trim(),
               },
             },
           });

           console.log("Supabase signup response:", { data, error });

           if (error) {
             console.error("Supabase signup error:", error);
             throw error;
           }

           if (data.user) {
             console.log("User created successfully:", data.user.id);
             // If email confirmation is enabled, session will be null.
             if (!data.session) {
               console.log("Email confirmation required for user:", data.user.id);
               throw new Error("Signup successful! Please check your email for a confirmation link to verify your account.");
             }
             set({
               session: {
                 userId: data.user.id,
                 email: data.user.email ?? email,
                 name: name.trim(),
                 issuedAt: Date.now(),
               },
             });
           } else {
             console.log("No user data returned from Supabase");
           }
           return;
         }

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
        if (supabaseEnabled && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          
          if (data.user) {
            const name = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User";
            set({
              session: {
                userId: data.user.id,
                email: data.user.email ?? email,
                name,
                issuedAt: Date.now(),
              },
            });
          }
          return;
        }

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
        if (supabaseEnabled && supabase) {
          supabase.auth.signOut();
        }
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

// Initialize Supabase Auth Listener if enabled to automatically sync auth state
if (supabaseEnabled && supabase) {
  // Check active session on startup
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";
      useAuthStore.setState({
        session: {
          userId: session.user.id,
          email: session.user.email ?? "",
          name,
          issuedAt: Date.now(),
        },
      });
    }
  });

  // Listen to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";
      useAuthStore.setState({
        session: {
          userId: session.user.id,
          email: session.user.email ?? "",
          name,
          issuedAt: Date.now(),
        },
      });
    } else {
      useAuthStore.setState({ session: null });
    }
  });
}

export function useHydratedAuth() {
  return useAuthStore;
}
