"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { usePublicAuthState } from "@/components/auth/use-public-auth-state";
import MembershipReserveButton from "@/components/public/MembershipReserveButton";
import PublicInlineAlert from "@/components/public/PublicInlineAlert";
import { Button } from "@/components/ui/button";
import type { MembershipPlan } from "@/lib/memberships";

interface MembershipPlansCatalogProps {
  membershipPlans: MembershipPlan[];
  whatsappUrl: string | null;
}

function buildMembershipWhatsAppUrl(
  baseUrl: string | null,
  plan: MembershipPlan,
) {
  const safeBaseUrl = baseUrl?.trim();

  if (!safeBaseUrl) {
    return null;
  }

  try {
    const url = new URL(safeBaseUrl);
    url.searchParams.set(
      "text",
      `Hola, quiero informacion sobre la membresia ${plan.title} (${plan.billing_label ?? `${plan.duration_days} dias`} - S/ ${plan.price_amount.toFixed(2)}).`,
    );
    return url.toString();
  } catch {
    return null;
  }
}

export default function MembershipPlansCatalog({
  membershipPlans,
  whatsappUrl,
}: Readonly<MembershipPlansCatalogProps>) {
  const { isAuthenticated } = usePublicAuthState();
  const catalogGridClass =
    membershipPlans.length === 1
      ? "mx-auto grid max-w-xl grid-cols-1 gap-4"
      : membershipPlans.length === 2
        ? "mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2"
        : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";

  if (membershipPlans.length === 0) {
    return (
      <div className="border border-white/10 bg-white/5 p-8 text-white rounded-[var(--radius-base)]">
        <PublicInlineAlert
          tone="warning"
          title="Catalogo operativo pendiente"
          message="Todavia no hay membresias activas cargadas para reservar desde la web. Cuando el equipo publique el catalogo, esta pagina mostrara la reserva real."
        />
      </div>
    );
  }

  return (
    <section 
      id="membership-plans" 
      data-component="membership-plans-catalog"
      className="space-y-12"
      aria-labelledby="plans-title"
    >
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-primary">
          Membresias
        </p>
        <h2 id="plans-title" className="mt-4 font-display text-3xl xs:text-4xl sm:text-5xl font-black uppercase tracking-tight text-white italic break-words">
          Elige Tu Plan
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm leading-6 sm:leading-7 text-white/65 px-2 sm:px-0">
          Membresias disponibles para solicitar desde la web y vincular a tu cuenta del club.
        </p>
      </div>

      <div className={catalogGridClass}>
        {membershipPlans.map((plan) => {
          const whatsappPlanUrl = buildMembershipWhatsAppUrl(whatsappUrl, plan);

          return (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col p-6 sm:p-8 lg:p-12 transition-all duration-500 overflow-hidden",
                plan.is_featured
                  ? "z-10 bg-white text-foreground shadow-2xl featured-card"
                  : "border border-white/5 bg-white/5 text-white hover:bg-white/10",
              ].join(" ")}
              style={{ borderRadius: "var(--radius-base)" }}
            >
              <div className="mb-8 sm:mb-10">
                <h3
                  className={[
                    "font-display text-xl sm:text-2xl font-bold uppercase tracking-widest break-words",
                    plan.is_featured ? "text-foreground/75" : "text-white/70",
                  ].join(" ")}
                >
                  {plan.title}
                </h3>
                <div className="mt-6 sm:mt-8 flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-5xl sm:text-6xl font-black tracking-tighter text-primary lg:text-7xl">
                    S/{plan.price_amount.toFixed(0)}
                  </span>
                  <span className={plan.is_featured ? "text-muted-foreground text-xs sm:text-sm" : "text-white/40 text-xs sm:text-sm"}>
                    {plan.billing_label ?? `${plan.duration_days} dias`}
                  </span>
                </div>
                <p className={plan.is_featured ? "mt-4 text-xs sm:text-sm leading-6 sm:leading-7 text-muted-foreground break-words" : "mt-4 text-xs sm:text-sm leading-6 sm:leading-7 text-white/65 break-words"}>
                  {plan.description ??
                    "Membresia operativa con QR, vigencia real y seguimiento desde tu cuenta."}
                </p>
              </div>

              <div className="mb-12 space-y-5">
                <div className={plan.is_featured ? "flex items-center gap-4 text-[15px] text-foreground" : "flex items-center gap-4 text-[15px] text-white"}>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-medium tracking-tight opacity-90">
                    {plan.duration_days} dias por ciclo
                  </span>
                </div>
                <div className={plan.is_featured ? "flex items-center gap-4 text-[15px] text-foreground" : "flex items-center gap-4 text-[15px] text-white"}>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-medium tracking-tight opacity-90">
                    QR operativo y vigencia real
                  </span>
                </div>
                <div className={plan.is_featured ? "flex items-center gap-4 text-[15px] text-foreground" : "flex items-center gap-4 text-[15px] text-white"}>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-medium tracking-tight opacity-90">
                    {isAuthenticated
                      ? "Se anade a tu cuenta y avisa al admin"
                      : "Atencion directa por WhatsApp si aun no tienes cuenta"}
                  </span>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                {isAuthenticated ? (
                  <MembershipReserveButton
                    membershipPlanId={plan.id}
                    label="Reservar membresia"
                    className="w-full bg-primary text-white hover:bg-secondary hover:text-white rounded-[var(--radius-base)]"
                  />
                ) : whatsappPlanUrl ? (
                  <Button
                    asChild
                    className="h-12 w-full bg-primary text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white hover:text-foreground rounded-[var(--radius-base)]"
                  >
                    <Link href={whatsappPlanUrl} target="_blank" rel="noreferrer" aria-label={`Hablar por WhatsApp sobre el plan ${plan.title}`}>
                      Hablar por WhatsApp
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="h-12 w-full bg-primary text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-white hover:text-foreground rounded-[var(--radius-base)]"
                  >
                    <Link href="/contacto" aria-label="Solicitar mas informacion">Solicitar informacion</Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
