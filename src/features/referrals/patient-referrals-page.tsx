import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildReferralBookingHref, type PatientReferralsPageData } from "@/lib/referral-shared";
import { formatDate, titleCase } from "@/lib/utils";

function getUrgencyVariant(urgency: string) {
  if (urgency === "emergency") return "warning" as const;
  if (urgency === "urgent") return "info" as const;
  return "neutral" as const;
}

function getStatusVariant(status: string) {
  if (status === "accepted") return "success" as const;
  if (status === "completed") return "neutral" as const;
  if (status === "cancelled") return "warning" as const;
  return "info" as const;
}

export function PatientReferralsPage({ referrals }: PatientReferralsPageData) {
  if (!referrals.length) {
    return (
      <Card className="p-8 text-center sm:p-10">
        <HeartHandshake className="mx-auto h-10 w-10 text-[var(--rose-600)]" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">No referrals yet</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">Your provider may refer you to a specialist when needed.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {referrals.map((referral) => (
        <Card key={referral.id} className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--rose-700)]">Referral update</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{referral.referredToSpecialty}</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">From {referral.referringProviderName} - {referral.referringProviderSpecialty}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getUrgencyVariant(referral.urgency)}>{titleCase(referral.urgency)}</Badge>
              <Badge variant={getStatusVariant(referral.status)}>{titleCase(referral.status)}</Badge>
            </div>
          </div>

          <p className="text-sm leading-7 text-[var(--foreground)]">{referral.reason}</p>
          <div className="rounded-[24px] bg-[var(--slate-50)] p-4 text-sm leading-6 text-[var(--foreground-muted)]">
            {referral.status === "pending" ? (
              <p>Your provider has referred you to a specialist. Maven Clinic will match you with an available provider.</p>
            ) : referral.status === "accepted" ? (
              <p>Your referral is ready. Book your specialist appointment whenever you are ready.</p>
            ) : referral.status === "completed" ? (
              <p>Your referral journey has been completed. You can review it any time here.</p>
            ) : (
              <p>This referral is no longer active. Reach out to your provider if you still need support.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--foreground-muted)]">
            <span>Created {formatDate(referral.createdAt)}</span>
            {referral.status === "accepted" ? (
              <Link
                href={buildReferralBookingHref(referral.referredToSpecialtyKey)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--rose-500)] px-5 text-sm font-medium text-white transition hover:bg-[var(--rose-600)]"
              >
                Book your referral appointment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
