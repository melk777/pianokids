"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClientComponent } from "@/lib/supabase";
import SocialTray from "./SocialTray";
import ChatWindow from "./ChatWindow";
import { FriendshipData } from "@/hooks/useSocial";
import { AnimatePresence } from "framer-motion";
import { User } from "@supabase/supabase-js";

export default function GlobalSocialOverlay() {
  const pathname = usePathname();
  const supabase = createClientComponent();
  const [user, setUser] = useState<User | null>(null);
  const [selectedFriendship, setSelectedFriendship] = useState<FriendshipData | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Não mostrar se não estiver logado ou se estiver na página do jogo
  const isGamePage = pathname?.startsWith("/piano") || pathname?.includes("/dashboard/play");
  if (!user || isGamePage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className="absolute inset-0 pointer-events-none">
        <SocialTray onSelectFriend={(f: FriendshipData) => setSelectedFriendship(f)} />
        
        <AnimatePresence>
          {selectedFriendship && (
            <div className="pointer-events-auto">
              <ChatWindow 
                friendship={selectedFriendship} 
                onClose={() => setSelectedFriendship(null)} 
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
