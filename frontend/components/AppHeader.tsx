"use client";

import Link from "next/link";

type AppHeaderProps = {
  title: string;
  showNav?: boolean;
};

export default function AppHeader({ title, showNav = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-800 hover:text-slate-900"
        >
          {title}
        </Link>
        {showNav && (
          <nav className="flex gap-4">
            <Link
              href="/history"
              className="text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              Trip History
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              Admin
            </Link>
          </nav>
        )}
        {!showNav && (
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Back to Planner
          </Link>
        )}
      </div>
    </header>
  );
}
