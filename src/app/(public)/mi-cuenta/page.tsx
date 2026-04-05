import {
  ShieldCheck, 
  ShoppingBag, 
  User, 
  Package, 
  Zap, 
  ArrowRight,
  Activity,
  History,
  ExternalLink,
  Lock,
  Star,
} from "lucide-react";
import Link from "next/link";

import MemberAccountSettings from "@/components/auth/MemberAccountSettings";
import MemberTestimonialForm from "@/components/auth/MemberTestimonialForm";
import AuthFeedbackDialog from "@/components/auth/AuthFeedbackDialog";
import { MemberSignOutButtonWithRedirect } from "@/components/auth/MemberSignOutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireMemberUser } from "@/lib/auth";
import { formatCartAmount } from "@/lib/cart/format";
import {
  getPickupRequestStatusTone,
  pickupRequestPaymentStatusLabels,
  pickupRequestStatusLabels,
} from "@/lib/cart/pickup-request";
import { getCurrentCartSnapshot } from "@/lib/cart/server";
import {
  getAuthenticatedMemberTestimonial,
  getMemberAccountViewModel,
} from "@/lib/data/member-account";
import { ensureMemberProfileForUser } from "@/lib/data/gym-management";
import { getMemberPickupRequestsHistory } from "@/lib/data/pickup-requests";
import {
  formatMemberAccountDate,
  getMemberAccountQuickLinks,
} from "@/lib/member-account";
import DashboardNotice from "@/components/admin/DashboardNotice";
import { cn } from "@/lib/utils";
import type {
  MemberAccountViewModel,
  MemberMarketingTestimonialViewModel,
} from "@/lib/data/member-account";
import type { Cart, PickupRequestDetail } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && error.message !== "An unknown error occurred.") {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const candidate = error as { message?: unknown };
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }
  }

  return fallback;
}

export default async function MemberAccountPage() {
  // 1. Autenticación
  const user = await requireMemberUser("/acceso?next=/mi-cuenta");
  
  // 2. Estados de Datos con Tipado Seguro
  let account: MemberAccountViewModel = { 
    fullName: "Socio Titan", 
    email: user.email ?? "", 
    providerLabel: "Autenticación Segura", 
    canManagePassword: false,
    phone: null
  };
  let activeCart: Cart | null = null;
  let testimonial: MemberMarketingTestimonialViewModel | null = null;
  let pickupHistory = { pickupRequests: [] as PickupRequestDetail[], warning: null as string | null };
  let loadError: string | null = null;

  // 3. Carga de Datos Resiliente
  try {
    try {
      await ensureMemberProfileForUser(user);
    } catch (e) {
      loadError = getSafeErrorMessage(e, "No se pudo sincronizar la ficha base del socio.");
    }

    const [accResult, cartResult, historyResult, testimonialResult] = await Promise.allSettled([
      getMemberAccountViewModel(user),
      getCurrentCartSnapshot(),
      getMemberPickupRequestsHistory({
        email: user.email,
        supabaseUserId: user.id,
      }),
      getAuthenticatedMemberTestimonial(),
    ]);

    if (accResult.status === "fulfilled") account = accResult.value;
    if (cartResult.status === "fulfilled") activeCart = cartResult.value;
    if (historyResult.status === "fulfilled") pickupHistory = historyResult.value;
    if (testimonialResult.status === "fulfilled") testimonial = testimonialResult.value;
    
    if (
      accResult.status === "rejected" ||
      historyResult.status === "rejected" ||
      testimonialResult.status === "rejected"
    ) {
       const rejectedReason =
         accResult.status === "rejected"
           ? accResult.reason
           : historyResult.status === "rejected"
             ? historyResult.reason
             : testimonialResult.status === "rejected"
               ? testimonialResult.reason
             : null;
       loadError = getSafeErrorMessage(
         rejectedReason,
         "Sincronizacion parcial. Los datos comerciales podrian no estar actualizados.",
       );
    }
  } catch (globalError) {
    loadError = getSafeErrorMessage(
      globalError,
      "Error de conexion con el servidor. Reintentando en breve.",
    );
  }

  // 4. Lógica de Vista
  const latestPickupRequest = pickupHistory?.pickupRequests?.[0] ?? null;
  const previousPickupRequests = pickupHistory?.pickupRequests?.slice(1) ?? [];
  const quickLinks = getMemberAccountQuickLinks({
    hasActiveCart: !!activeCart?.items?.length,
    hasPickupHistory: pickupHistory?.pickupRequests?.length > 0,
  });

  return (
    <main className="min-h-screen bg-[#fbfbf8]">
      <AuthFeedbackDialog variant="welcome" />
      
      {/* HEADER INDUSTRIAL SUPERIOR */}
      <header className="bg-[#111111] py-5 px-6 lg:px-12 flex items-center justify-between border-b border-white/10 sticky top-0 z-30">
         <div className="flex items-center gap-6">
            <div className="h-8 w-8 bg-white flex items-center justify-center p-1.5">
               <Activity className="h-full w-full text-[#d71920]" />
            </div>
            <div className="hidden sm:block">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Portal del Socio</p>
               <p className="text-xs font-bold text-white uppercase tracking-widest">TITAN GYM SYSTEM <span className="text-white/20">/</span> V2.0</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Badge variant="success" className="bg-green-500/10 text-green-500 border-none font-black uppercase text-[8px] h-6 px-3">Sessión Activa</Badge>
            <div className="h-6 w-px bg-white/10" />
            <MemberSignOutButtonWithRedirect />
            <div className="h-6 w-px bg-white/10" />
            <Link href="/" className="text-[10px] font-black uppercase text-white/60 hover:text-white transition-colors flex items-center gap-2">
               Sitio Público <ExternalLink className="h-3 w-3" />
            </Link>
         </div>
      </header>

      <div className="w-full px-6 py-12 lg:px-12 lg:py-20 max-w-[1600px] mx-auto">
        
        {loadError && (
          <div className="mb-12">
             <DashboardNotice message={loadError} tone="warning" />
          </div>
        )}

        <div className="flex flex-col gap-12">
          {/* TITULO HERO SECCIÓN */}
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between border-b border-black/5 pb-12">
             <div className="space-y-3">
                <p className="font-black text-[10px] uppercase tracking-[0.4em] text-[#d71920]">Zona de Entrenamiento Digital</p>
                <h1 className="font-display text-6xl font-black uppercase tracking-tighter text-[#111111] sm:text-8xl italic">
                  MI <span className="text-black/10">ESPACIO</span>
                </h1>
             </div>
             <div className="flex items-center gap-6">
                <div className="bg-white border border-black/10 p-6 shadow-xl text-center min-w-[180px]">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#7a7f87]">Último Acceso</p>
                   <p className="text-sm font-bold text-[#111111] uppercase tracking-tighter mt-1">{formatMemberAccountDate(user.last_sign_in_at)}</p>
                </div>
             </div>
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 gap-12 xl:grid-cols-[400px_1fr]">
             
             {/* SIDEBAR: IDENTIDAD */}
             <aside className="space-y-10">
                <div className="sticky top-28 space-y-10">
                   
                   {/* ID CARD */}
                   <div className="bg-[#111111] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10 space-y-10">
                         <div className="flex justify-between items-start">
                            <div className="h-20 w-20 bg-white flex items-center justify-center shadow-inner">
                               <User className="h-10 w-10 text-[#111111]" />
                            </div>
                            <div className="bg-[#d71920] px-3 py-1">
                               <p className="text-[9px] font-black uppercase tracking-widest text-white">PRO MEMBER</p>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-widest text-white/30">Ficha del Socio</p>
                            <h2 className="text-4xl font-display font-black uppercase tracking-tight leading-none italic">{account.fullName}</h2>
                            <p className="text-sm font-medium text-white/60 mt-4 border-l-2 border-[#d71920] pl-4">{account.email}</p>
                         </div>

                         <div className="pt-8 border-t border-white/5 space-y-5">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-white/20">Identificador</span>
                               <span className="text-[10px] font-mono text-white/40">{user.id.slice(0,12).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-white/20">Miembro desde</span>
                               <span className="text-[10px] font-bold text-white/60">{formatMemberAccountDate(user.created_at)}</span>
                            </div>
                         </div>
                      </div>
                      <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-[#d71920]/10 rounded-full blur-[120px] group-hover:bg-[#d71920]/20 transition-all duration-700" />
                   </div>

                   {/* SECURITY & STATUS */}
                   <div className="bg-white border border-black/10 p-8 shadow-sm space-y-6">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="h-5 w-5 text-green-600" />
                         <p className="text-[11px] font-black uppercase tracking-widest text-[#111111]">Estatus de Cuenta</p>
                      </div>
                      <div className="bg-[#fbfbf8] p-4 border border-black/5">
                         <p className="text-[9px] font-black uppercase text-[#7a7f87] mb-2">Auth Provider</p>
                         <p className="text-xs font-bold text-[#111111] uppercase tracking-tighter italic">{account.providerLabel}</p>
                      </div>
                      <div className="flex items-center gap-3 px-2">
                         <Lock className="h-3 w-3 text-black/20" />
                         <p className="text-[10px] text-[#7a7f87] font-medium leading-relaxed">Protección de datos activa mediante políticas RLS de nivel 4.</p>
                      </div>
                   </div>

                   {/* NAVIGATION LINKS */}
                   <div className="space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#111111] px-2">Acceso a Funciones</p>
                      <div className="grid gap-2">
                         {quickLinks.map((link) => (
                            <Link 
                              key={link.href} 
                              href={link.href}
                              className="group flex items-center justify-between bg-white border border-black/10 p-5 transition-all hover:border-[#111111] hover:translate-x-1"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="h-1.5 w-1.5 rounded-full bg-black/10 group-hover:bg-[#d71920]" />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-[#7a7f87] group-hover:text-[#111111]">{link.label}</span>
                               </div>
                               <ArrowRight className="h-4 w-4 text-black/10 group-hover:text-[#d71920]" />
                            </Link>
                         ))}
                      </div>
                   </div>

                </div>
             </aside>

             {/* MAIN CONTENT AREA */}
             <div className="space-y-16">
                
                {/* SECTION: PERFIL */}
                <section className="space-y-8">
                   <div className="flex items-center justify-between border-b border-black/10 pb-6">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 bg-[#111111] flex items-center justify-center">
                            <Activity className="h-7 w-7 text-[#d71920]" />
                         </div>
                         <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-[#111111]">Gestión de Perfil</h2>
                      </div>
                      <Badge variant="muted" className="h-8 px-4 font-black uppercase text-[9px] tracking-widest bg-black/5 border-none">Información General</Badge>
                   </div>
                   <div className="bg-white border border-black/10 p-10 shadow-lg">
                      <MemberAccountSettings initialAccount={account} />
                   </div>
                </section>

                <section className="space-y-8">
                   <div className="flex items-center gap-4 border-b border-black/10 pb-6">
                      <div className="h-14 w-14 bg-[#111111] flex items-center justify-center">
                         <Star className="h-7 w-7 text-[#d71920]" />
                      </div>
                      <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-[#111111]">
                        Resena de la Comunidad
                      </h2>
                   </div>
                   <MemberTestimonialForm initialTestimonial={testimonial} />
                </section>

                {/* SECTION: E-COMMERCE */}
                <section className="space-y-8">
                   <div className="flex items-center gap-4 border-b border-black/10 pb-6">
                      <div className="h-14 w-14 bg-[#111111] flex items-center justify-center">
                         <ShoppingBag className="h-7 w-7 text-[#d71920]" />
                      </div>
                      <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-[#111111]">E-Commerce & Carrito</h2>
                   </div>
                   
                   <div className={cn(
                     "p-12 border shadow-2xl transition-all relative overflow-hidden",
                     activeCart && activeCart.items?.length > 0 ? "bg-[#111111] text-white border-[#111111]" : "bg-[#fbfbf8] border-black/10 border-dashed"
                   )}>
                      {activeCart && activeCart.items?.length > 0 ? (
                         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <Zap className="h-6 w-6 text-[#d71920] fill-current animate-bounce" />
                                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d71920]">Checkout Pendiente</p>
                               </div>
                               <h3 className="text-4xl font-display font-black uppercase tracking-tight italic">Tienes {activeCart.summary.itemCount} artículos esperando</h3>
                               <p className="text-xl text-white/40">Total estimado: <span className="text-white font-bold">{formatCartAmount(activeCart.summary.total, activeCart.summary.currencyCode)}</span></p>
                            </div>
                            <Button asChild className="h-20 px-16 bg-[#d71920] text-white font-black uppercase tracking-[0.3em] hover:bg-white hover:text-[#111111] transition-all rounded-none text-xs shadow-xl">
                               <Link href="/carrito">FINALIZAR PEDIDO</Link>
                            </Button>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center justify-center py-10 gap-6">
                            <div className="h-20 w-20 bg-black/5 flex items-center justify-center rounded-full">
                               <ShoppingBag className="h-10 w-10 text-black/10" />
                            </div>
                            <div className="text-center space-y-2">
                               <p className="text-xl font-black uppercase text-[#111111] tracking-tight">Tu carrito está vacío</p>
                               <p className="text-sm text-[#7a7f87] max-w-sm">Explora el catálogo de suplementación y equipamiento profesional de Titan Gym.</p>
                            </div>
                            <Link href="/tienda" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d71920] hover:underline underline-offset-8">Ir a la Tienda Pro</Link>
                         </div>
                      )}
                      {activeCart && activeCart.items?.length > 0 && (
                         <div className="absolute top-0 right-0 h-full w-1/2 bg-[#d71920]/5 -skew-x-12 translate-x-20" />
                      )}
                   </div>
                </section>

                {/* SECTION: LOGÍSTICA */}
                <section className="space-y-8">
                   <div className="flex items-center gap-4 border-b border-black/10 pb-6">
                      <div className="h-14 w-14 bg-[#111111] flex items-center justify-center">
                         <Package className="h-7 w-7 text-[#d71920]" />
                      </div>
                      <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-[#111111]">Logística de Recogida</h2>
                   </div>

                   <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
                      <div className="bg-white border border-black/10 p-12 shadow-xl space-y-10">
                         <div className="flex items-center justify-between border-b border-black/5 pb-8">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#7a7f87]">Tracking de Pedido Reciente</p>
                            <History className="h-5 w-5 text-black/10" />
                         </div>
                         
                         {latestPickupRequest ? (
                            <div className="space-y-10">
                               <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                  <div className="space-y-2">
                                     <p className="text-[10px] font-black uppercase text-[#d71920] tracking-widest">Referencia Oficial</p>
                                     <h3 className="text-6xl font-display font-black uppercase tracking-tighter text-[#111111] italic leading-none">{latestPickupRequest.requestNumber}</h3>
                                  </div>
                                  <div className="flex flex-col items-end gap-3">
                                     <Badge variant="default" className={cn("text-[10px] font-black uppercase h-8 px-6 rounded-none tracking-widest", getPickupRequestStatusTone(latestPickupRequest.status) === 'success' ? 'bg-green-600' : 'bg-[#111111]')}>
                                        {pickupRequestStatusLabels[latestPickupRequest.status]}
                                     </Badge>
                                     <p className="text-[10px] font-bold text-[#7a7f87] uppercase tracking-widest">Pago: {pickupRequestPaymentStatusLabels[latestPickupRequest.paymentStatus]}</p>
                                  </div>
                               </div>
                               <div className="p-8 bg-[#fbfbf8] border border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                  <div>
                                     <p className="text-[10px] font-black uppercase text-[#7a7f87] mb-2 tracking-widest">Monto de Operación</p>
                                     <p className="text-4xl font-display font-black text-[#111111] leading-none">{formatCartAmount(latestPickupRequest.total, latestPickupRequest.currencyCode)}</p>
                                  </div>
                                  <Button asChild variant="outline" className="h-14 px-10 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-none shadow-lg">
                                     <Link href={`/mi-cuenta/pedidos/${latestPickupRequest.id}`}>VER TRAZABILIDAD</Link>
                                  </Button>
                               </div>
                            </div>
                          ) : (
                             <div className="py-16 text-center border-2 border-dashed border-black/5 bg-[#fbfbf8]">
                                <p className="text-sm font-bold text-black/20 uppercase tracking-[0.4em]">Sin registros logísticos.</p>
                             </div>
                          )}
                       </div>

                       <div className="bg-[#111111] p-12 flex flex-col justify-center items-center gap-6 text-white shadow-2xl relative overflow-hidden">
                          <Activity className="h-10 w-10 text-[#d71920]" />
                          <div className="text-center space-y-2 relative z-10">
                             <p className="text-8xl font-display font-black text-white leading-none tracking-tighter">{pickupHistory?.pickupRequests?.length || 0}</p>
                             <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Pedidos Totales</p>
                          </div>
                       </div>
                    </div>

                    {previousPickupRequests.length > 0 && (
                       <div className="bg-white border border-black/10 shadow-lg overflow-hidden mt-10">
                          <div className="bg-[#111111] px-10 py-5 flex items-center justify-between border-b border-white/5">
                             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Archivo Histórico</p>
                             <span className="text-[10px] font-bold text-white/20 uppercase">{previousPickupRequests.length} Entradas</span>
                          </div>
                          <div className="divide-y divide-black/5">
                             {previousPickupRequests.map((req) => (
                                <div key={req.id} className="px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#fbfbf8] transition-all gap-6">
                                   <div className="space-y-2">
                                      <div className="flex items-center gap-3">
                                         <div className="h-1.5 w-1.5 rounded-full bg-[#d71920]" />
                                         <p className="text-sm font-black uppercase text-[#111111] tracking-tight">{req.requestNumber}</p>
                                      </div>
                                      <p className="text-[10px] font-bold text-[#7a7f87] pl-4 uppercase tracking-widest">{formatMemberAccountDate(req.updatedAt)}</p>
                                   </div>
                                   <div className="flex items-center gap-10">
                                      <div className="text-right">
                                         <p className="text-[9px] font-black uppercase text-[#7a7f87] mb-1">Monto</p>
                                         <p className="text-sm font-black text-[#111111]">{formatCartAmount(req.total, req.currencyCode)}</p>
                                      </div>
                                      <Link href={`/mi-cuenta/pedidos/${req.id}`} className="h-12 w-12 bg-white border border-black/10 flex items-center justify-center hover:bg-[#111111] hover:text-white transition-all shadow-sm">
                                         <ArrowRight className="h-5 w-5" />
                                      </Link>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </section>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
