"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useHydrated } from "@/lib/hooks/useHydrated";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const router = useRouter();
  const hydrated = useHydrated();

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl text-stone-900">
            Stone<span className="text-emerald-600">Pedia</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-stone-800">
                {user.name}
              </div>
              <div className="text-xs text-stone-400">{user.email}</div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                user.role === "BUYER"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {user.role}
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
