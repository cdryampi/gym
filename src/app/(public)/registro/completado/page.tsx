import RegistrationSuccessCard from "@/components/auth/RegistrationSuccessCard";
import { hasSupabasePublicEnv } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemberRegisterCompletePageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function MemberRegisterCompletePage({
  searchParams,
}: Readonly<MemberRegisterCompletePageProps>) {
  const { email } = await searchParams;

  return (
    <div className="section-shell flex min-h-screen items-center justify-center py-16">
      {hasSupabasePublicEnv() ? (
        <RegistrationSuccessCard email={email} />
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Configura Supabase antes de habilitar el registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[#5f6368]">
            <p>
              Falta configurar <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
