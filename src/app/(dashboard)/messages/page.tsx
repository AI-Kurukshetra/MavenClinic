import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
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
  try {
    const [data, params] = await Promise.all([getPatientMessagingPageData(), searchParams]);
    const initialComposerValue = params.topic ? `I'd like to ask about ${params.topic}.` : undefined;

    return (
      <DashboardShell title="Secure messages" eyebrow="Realtime provider communication">
        <MessagesWorkspace {...data} initialComposerValue={initialComposerValue} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Messages page error:", error);
    return (
      <DashboardShell title="Secure messages" eyebrow="Realtime provider communication">
        <PageErrorState title="Unable to load messages" message="Please refresh the page to try again." href="/messages" />
      </DashboardShell>
    );
  }
}
