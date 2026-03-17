import AuthFeedbackDialog from "@/components/auth/AuthFeedbackDialog";
import MemberSignOutButton from "@/components/auth/MemberSignOutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberUser } from "@/lib/auth";
import { getMarketingData } from "@/lib/data/site";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteTopbar from "@/components/marketing/SiteTopbar";

export default async function MemberAccountPage() {
  const user = await requireMemberUser("/acceso?next=/mi-cuenta");
  const { settings } = await getMarketingData();

  return (
    <div className="min-h-screen bg-[#151518]">
      <div className="sticky top-0 z-50">
        <SiteTopbar settings={settings} />
        <SiteHeader settings={settings} currentUser={user} />
      </div>
      <main className="section-shell py-16">
        <AuthFeedbackDialog variant="welcome" />
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Mi cuenta</CardTitle>
            <CardDescription>
              Tu acceso ya esta creado. Esta zona ira creciendo cuando activemos funciones privadas
              del gimnasio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-black/8 bg-[#fbfbf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
                Cuenta activa
              </p>
              <p className="mt-2 text-lg font-semibold text-[#111111]">{user.email}</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6368]">
                Estado actual: acceso basico creado. Proximamente podras revisar informacion privada
                del gimnasio desde aqui.
              </p>
            </div>
            <MemberSignOutButton />
          </CardContent>
        </Card>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
