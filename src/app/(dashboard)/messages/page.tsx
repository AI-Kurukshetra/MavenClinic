import type { Metadata } from "next";
import { DashboardShell } from "@/components/health/dashboard-shell";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { getPatientMessagingPageData } from "@/lib/messaging";

export const metadata: Metadata = {
  title: "Messages — Maven Clinic",
};

export const revalidate = 0;

export default async function MessagesPage() {
  const data = await getPatientMessagingPageData();

  return (
    <DashboardShell title="Secure messages" eyebrow="Realtime provider communication">
      <MessagesWorkspace {...data} />
    </DashboardShell>
  );
}