import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Sparkles, LogOut, LayoutDashboard, BarChart3, History, FileText, Search, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/keywords", label: "Keywords", icon: Search },
  { to: "/cover-letter", label: "Cover Letter", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !session) {
      navigate({ to: "/auth/login", search: { redirect: window.location.pathname } });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/40 text-sm">
        Loading…
      </div>
    );
  }
  if (!session) return null;

  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-[#0a0a0f]/70 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 grid place-items-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Resume AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm text-white/60 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition"
                activeProps={{ className: "text-white bg-white/10" }}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 grid place-items-center text-xs font-semibold">
                {initials}
              </div>
              <span>{session.name.split(" ")[0]}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-white/5 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 text-xs text-white/60 whitespace-nowrap">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:text-white hover:bg-white/5"
                activeProps={{ className: "text-white bg-white/10" }}
              >
                <item.icon className="h-3 w-3" /> {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}
