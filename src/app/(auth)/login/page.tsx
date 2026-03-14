import { loginAction } from "@/app/(auth)/actions";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthSplitLayout>
      <LoginForm action={loginAction} serverError={params.error} serverMessage={params.message} next={params.next} />
    </AuthSplitLayout>
  );
}