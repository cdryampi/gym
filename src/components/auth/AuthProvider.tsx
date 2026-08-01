"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseBrowserAuth } from "@/lib/firebase/client";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

async function syncSession(idToken: string | null) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken,
    }),
  }).catch(() => undefined);
}

export default function AuthProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void getFirebaseBrowserAuth().then((auth) => {
      if (!auth) {
        setLoading(false);
        return;
      }

      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;
        
        // Sincronizar cookie de sesión antes de marcar como "not loading"
        await syncSession(idToken);
        
        setUser(firebaseUser);
        setLoading(false);
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f5f0]"
          >
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                {/* Logo con pulsación */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ 
                    scale: [0.9, 1.05, 1],
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  className="relative h-24 w-24"
                >
                  <Image
                    src={DEFAULT_OG_IMAGE_PATH}
                    alt="Nova Forza Gym"
                    fill
                    className="object-contain"
                    sizes="96px"
                    priority
                  />
                </motion.div>
                
                {/* Spinner circular minimalista */}
                <div className="absolute -inset-4">
                  <svg className="h-32 w-32 animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="#111111"
                      strokeWidth="0.5"
                      strokeDasharray="10 200"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-sm font-black uppercase tracking-[0.5em] text-[#111111]"
                >
                  Nova Forza <span className="text-[#d71920]">Gym</span>
                </motion.p>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="mt-4 h-px bg-[#d71920]/20"
                />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#111111]/30">
                  Operación de alto rendimiento
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!loading && children}
    </AuthContext.Provider>
  );
}
