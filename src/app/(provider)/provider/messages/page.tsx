import { DashboardShell } from "@/components/health/dashboard-shell";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { getProviderMessagingPageData } from "@/lib/messaging";

export default async function ProviderMessagesPage() {
  const data = await getProviderMessagingPageData();

  return (
    <DashboardShell title="Provider messages" eyebrow="Patient communication" section="provider">
      <MessagesWorkspace {...data} />
    </DashboardShell>
  );
}