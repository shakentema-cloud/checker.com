import { useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { userStore, type LocalUser } from "@/lib/storage";

export type { LocalUser };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);

  const refreshLocalUser = useCallback(() => {
    setLocalUser(userStore.get());
  }, []);

  useEffect(() => {
    // Load local user first (synchronous)
    setLocalUser(userStore.get());

    // Then try Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    userStore.clear();
    setLocalUser(null);
    setUser(null);
    setSession(null);
  };

  const isAuthed = !!user || !!localUser;
  const currentUser = localUser;
  const isPro = localUser?.is_pro || false;

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    localUser?.display_name ||
    localUser?.username ||
    "Guest";

  return {
    user, session, loading, localUser, currentUser,
    guest: localUser,
    isAuthed, isPro, displayName,
    signOut, refreshLocalUser,
  };
}

// Compatibility alias used in older pages
export function updateGuest(patch: Partial<LocalUser>) {
  const u = userStore.get();
  if (!u) return;
  userStore.save({ ...u, ...patch });
}
