import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { getPatientMessagingPageData } from "@/lib/messaging";

export const metadata: Metadata = {
  title: "Messages - Maven Clinic",
};

export const revalidate = 0;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [data, params] = await Promise.all([getPatientMessagingPageData(), searchParams]);
  const initialComposerValue = params.topic ? `I'd like to ask about ${params.topic}.` : undefined;

  return (
    <DashboardShell title="Secure messages" eyebrow="Realtime provider communication">
      <MessagesWorkspace {...data} initialComposerValue={initialComposerValue} />
    </DashboardShell>
  );
}
