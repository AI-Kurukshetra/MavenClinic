import { signupAction } from "@/app/(auth)/actions";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <AuthSplitLayout>
      <SignupForm action={signupAction} serverError={params.error} />
    </AuthSplitLayout>
  );
}