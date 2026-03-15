import { signupAction } from "@/app/(auth)/actions";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import {
  getPatientInvitationByToken,
  getPatientInvitationError,
  normalizePatientInvitationToken,
} from "@/lib/patient-invitations";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>;
}) {
  const params = await searchParams;
  const token = normalizePatientInvitationToken(params.token);
  const invitation = token ? await getPatientInvitationByToken(token) : null;
  const invitationError = token ? getPatientInvitationError(invitation) : null;
  const error = params.error ?? invitationError ?? undefined;
  const employerName = invitation?.metadata?.employer_name ?? undefined;

  return (
    <AuthSplitLayout>
      <SignupForm
        action={signupAction}
        serverError={error}
        invitationToken={token || undefined}
        invitedEmail={invitation?.email ?? undefined}
        invitedEmployerName={employerName}
      />
    </AuthSplitLayout>
  );
}
