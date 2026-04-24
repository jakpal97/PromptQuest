import { createClient } from '@supabase/supabase-js';

let _client = null;
let _serviceClient = null;

function createBrowserClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
  }
  return _client;
}

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
    );
  }
  return _serviceClient;
}

// Proxy który lazy-inicjalizuje klienta dopiero przy pierwszym użyciu
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const client = createBrowserClient();
      const value = client[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
  }
);
