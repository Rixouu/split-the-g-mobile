import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { appConfig } from '@/lib/config';
import { secureStoreAdapter } from '@/lib/supabase/secure-store-adapter';

export const supabase = createClient(
  appConfig.supabaseUrl || 'https://placeholder.supabase.co',
  appConfig.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: secureStoreAdapter,
    },
  },
);
