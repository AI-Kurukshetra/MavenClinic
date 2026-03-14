import { ReactNode } from "react";
import { ShieldCheck, Star, WalletCards } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { AuthLogo } from "@/components/auth/auth-logo";

type Props = {
  children: ReactNode;
};

export function AuthSplitLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-white md:grid md:grid-cols-[1.22fr_1fr]">
      <AuthBrandPanel />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-8 md:px-10 lg:px-14">
        <div className="absolute inset-x-0 top-0 h-[30vh] bg-[linear-gradient(180deg,rgba(232,125,155,0.18),rgba(255,255,255,0))] md:hidden" />
        <div className="relative z-10 flex w-full max-w-[420px] flex-col justify-center">
          <div className="mb-8 flex flex-col items-center gap-5 md:hidden">
            <AuthLogo />
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-[rgba(232,125,155,0.14)] bg-[rgba(255,241,244,0.58)] px-4 py-2 text-xs font-medium text-[var(--foreground-muted)]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--rose-500)]" />HIPAA</span>
              <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-[var(--rose-500)] text-[var(--rose-500)]" />4.9 Rating</span>
              <span className="inline-flex items-center gap-1.5"><WalletCards className="h-3.5 w-3.5 text-[var(--teal-500)]" />Free to start</span>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}