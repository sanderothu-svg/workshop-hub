import { supabase } from './supabaseClient';

export function createDummyWorkshopSession() {
  return {
    id: `dummy-${Date.now()}`,
    provider: supabase ? 'supabase' : 'local-dummy',
    createdAt: new Date().toISOString()
  };
}

