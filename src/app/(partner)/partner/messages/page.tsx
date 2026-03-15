import { DashboardShell } from "@/components/health/dashboard-shell";
import { Card } from "@/components/ui/card";
import { PartnerAccessDeniedCard, PartnerEmptyState } from "@/features/partner/partner-shared";
import { getPartnerMessagesPageData } from "@/lib/partner-data";

export default async function PartnerMessagesPage() {
  const data = await getPartnerMessagesPageData();

  return (
    <DashboardShell title="Messages" eyebrow="Partner portal" section="partner">
      <div className="space-y-6">
        {!data.context.flags.messages ? (
          <PartnerAccessDeniedCard patientName={data.context.patientName} area="messages" />
        ) : (
          <>
            <Card className="border-[rgba(61,191,173,0.18)] bg-[rgba(61,191,173,0.08)]">
              <p className="text-sm font-medium text-[var(--teal-700)]">You are viewing as a support partner. Messages are read-only.</p>
            </Card>
            {!data.conversations.length ? (
              <PartnerEmptyState title="No shared conversations yet" description="When provider conversations are shared with full access, they will appear here in a read-only timeline." />
            ) : (
              data.conversations.map((conversation) => (
                <Card key={conversation.id}>
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{conversation.providerName}</h2>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{conversation.providerSpecialty}</p>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">Last update {conversation.lastUpdatedLabel}</p>
                  </div>
                  <div className="mt-5 space-y-3">
                    {conversation.messages.map((message) => (
                      <div key={message.id} className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-7 ${message.sender === 'provider' ? 'bg-[rgba(61,191,173,0.10)] text-[var(--foreground)]' : 'bg-slate-100 text-[var(--foreground-muted)]'}`}>
                        <p className="font-medium">{message.senderName}</p>
                        <p className="mt-1">{message.content}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{message.createdAtLabel}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
