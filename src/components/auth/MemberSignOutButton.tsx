"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MemberSignOutButton() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setIsPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleSignOut} disabled={isPending}>
      <LogOut className="h-4 w-4" />
      Cerrar sesion
    </Button>
  );
}
