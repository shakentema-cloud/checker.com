import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface GuestProfile {
  id: string;
  username: string;
  display_name: string;
  city: string;
  country: string;
  is_guest: true;
  is_pro: boolean;
}

const GUEST_KEY = "checker.guest";

function loadGuest(): GuestProfile {
  if (typeof window === "undefined") {
    return {
      id: "guest", username: "Guest", display_name: "Guest",
      city: "Almaty", country: "KZ", is_guest: true, is_pro: false,
    };
  }
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw) try { return JSON.parse(raw); } catch {}
  const g: GuestProfile = {
    id: `guest-${Math.random().toString(36).slice(2, 10)}`,
    username: `guest_${Math.random().toString(36).slice(2, 6)}`,
    display_name: "Guest Player",
    city: "Almaty",
    country: "KZ",
    is_guest: true,
    is_pro: false,
  };
  localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  return g;
}

export function updateGuest(patch: Partial<GuestProfile>) {
  if (typeof window === "undefined") return;
  const g = { ...loadGuest(), ...patch };
  localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  return g;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<GuestProfile | null>(null);

  useEffect(() => {
    setGuest(loadGuest());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return {
    user, session, loading, guest,
    isAuthed: !!user,
    displayName: user?.user_metadata?.display_name || user?.email?.split("@")[0] || guest?.display_name || "Guest",
    signOut,
  };
}
