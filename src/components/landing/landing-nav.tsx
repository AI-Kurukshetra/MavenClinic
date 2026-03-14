"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#patients", label: "For Patients" },
  { href: "#providers", label: "For Providers" },
  { href: "#employers", label: "For Employers" },
  { href: "#how-it-works", label: "How it works" },
];

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-[var(--border)] bg-white/94 shadow-[0_18px_50px_rgba(25,22,17,0.06)] backdrop-blur-xl" : "bg-white/80",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[0.02em]">
            <span className="inline-flex h-3.5 w-3.5 rounded-full bg-[var(--rose-500)] shadow-[0_0_0_8px_rgba(232,125,155,0.14)]" />
            <span className="text-base sm:text-lg">Maven Clinic</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--foreground-muted)] lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-[var(--foreground)]">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[rgba(45,45,45,0.04)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(212,88,123,0.28)] transition hover:bg-[var(--rose-600)]"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[rgba(250,250,248,0.98)] px-6 pb-10 pt-24 transition-all duration-300 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="mx-auto flex h-full max-w-md flex-col justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3 text-sm font-semibold tracking-[0.02em]">
              <span className="inline-flex h-3.5 w-3.5 rounded-full bg-[var(--rose-500)] shadow-[0_0_0_8px_rgba(232,125,155,0.14)]" />
              <span className="text-base">Maven Clinic</span>
            </div>
            <div className="space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-[28px] border border-[var(--border)] bg-white px-5 py-4 text-lg font-medium shadow-[0_18px_40px_rgba(25,22,17,0.04)]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-[3.25rem] w-full items-center justify-center rounded-full border border-[var(--border)] bg-white text-base font-medium text-[var(--foreground)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-[3.25rem] w-full items-center justify-center rounded-full bg-[var(--rose-500)] text-base font-medium text-white shadow-[0_14px_34px_rgba(212,88,123,0.28)]"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
