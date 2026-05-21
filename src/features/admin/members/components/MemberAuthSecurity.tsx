"use client";

import { ShieldCheck, HelpCircle } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { NFCard } from "@/components/system/nf-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AuthLinkOption } from "@/lib/data/gym-management";

interface MemberAuthSecurityProps {
  authOptions: AuthLinkOption[];
}

export function MemberAuthSecurity({ authOptions }: Readonly<MemberAuthSecurityProps>) {
  const { control } = useFormContext();

  return (
    <NFCard 
      title="Seguridad y Acceso" 
      description="Vinculación de cuenta para uso de App Móvil."
      className="bg-white border-black/5 shadow-xl shadow-black/[0.02]"
    >
      <FormField
        control={control}
        name="linkedUserId"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <div className="flex items-center gap-2 group/label">
              <ShieldCheck className="size-3.5 text-muted-foreground/60 transition-colors group-focus-within/label:text-[#d71920]" />
              <FormLabel className="text-[10px] font-black uppercase tracking-wider text-[#7a7f87] group-focus-within/label:text-[#111111] transition-colors">
                Cuenta Digital Vinculada
              </FormLabel>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3 text-muted-foreground/30 cursor-help transition-all hover:text-[#111111] hover:scale-110" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#111111] text-white border-none p-3 text-[10px] font-bold uppercase tracking-tight max-w-[220px]">
                    Asigna el correo con el que el socio iniciará sesión en su App de entrenamiento.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select disabled onValueChange={field.onChange} value={field.value ?? "none"}>
              <FormControl>
                <SelectTrigger className="h-12 cursor-not-allowed rounded-xl border-black/5 bg-black/[0.04] px-4 font-bold text-[#7a7f87] opacity-70 focus:border-black/5 focus:ring-0">
                  <SelectValue placeholder="Sin vinculación activa" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-xl border-black/5 shadow-2xl z-[100]">
                <SelectItem value="none" className="text-xs font-bold uppercase py-3 text-muted-foreground">Sin vinculación activa</SelectItem>
                {authOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs font-bold uppercase py-3">
                    {opt.displayName} <span className="opacity-40 font-medium ml-1">({opt.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] font-medium italic opacity-70 text-[#5f6368]">
              Gestion bloqueada desde ficha. El acceso digital se vincula por registro/importacion.
            </p>
            <FormMessage className="text-[9px] font-black uppercase text-[#d71920]" />
          </FormItem>
        )}
      />
    </NFCard>
  );
}
