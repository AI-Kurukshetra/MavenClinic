export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/health/dashboard-shell";
import { PageErrorState } from "@/components/ui/PageErrorState";
import { MessagesWorkspace } from "@/features/messages/messages-workspace";
import { getProviderMessagingPageData } from "@/lib/messaging";

export default async function ProviderMessagesPage() {
  try {
    const data = await getProviderMessagingPageData();

    return (
      <DashboardShell title="Provider messages" eyebrow="Patient communication" section="provider">
        <MessagesWorkspace {...data} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Provider messages page error:", error);
    return <PageErrorState title="Unable to load provider messages" message="Please refresh the page to try again." href="/provider/messages" />;
  }
}
