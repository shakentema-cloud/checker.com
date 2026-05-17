// Supabase client with graceful fallback when env vars are missing.
// If VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are absent,
// all Supabase calls silently no-op and the app runs in local-only mode.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) || '';

export const supabaseAvailable = !!(SUPABASE_URL && SUPABASE_KEY);

function createNoopClient() {
  const noop = () => ({ data: null, error: { message: 'Supabase not configured' } });
  const chain = () => ({
    select: () => chain(),
    insert: () => chain(),
    update: () => chain(),
    delete: () => chain(),
    eq: () => chain(),
    single: () => Promise.resolve({ data: null, error: null }),
    limit: () => chain(),
    then: (resolve: (v: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
  });
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Local mode' } }),
      signUp: async () => ({ data: null, error: { message: 'Local mode' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (_table: string) => chain(),
  };
}

let _client: ReturnType<typeof createClient<Database>> | ReturnType<typeof createNoopClient>;

function getClient() {
  if (!_client) {
    if (supabaseAvailable) {
      try {
        _client = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            storage: typeof window !== 'undefined' ? localStorage : undefined,
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (e) {
        console.warn('[Supabase] Failed to initialize, using local mode:', e);
        _client = createNoopClient() as any;
      }
    } else {
      console.info('[Supabase] No env vars found — running in local-only mode.');
      _client = createNoopClient() as any;
    }
  }
  return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop, receiver) {
    return Reflect.get(getClient() as any, prop, receiver);
  },
});
