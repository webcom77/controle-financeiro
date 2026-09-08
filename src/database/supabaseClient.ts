import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_CUSTOM_URL = 'cf_supabase_url';
const STORAGE_KEY_CUSTOM_KEY = 'cf_supabase_key';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

// Credenciais padrão embutidas no código (conectam automaticamente sem precisar digitar nada)
export const DEFAULT_SUPABASE_URL = 'https://ryzqbtssaiaaovnsmfkt.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_03F9Tonk8HVKgSapNE8kjw_iFyb6N4s';

export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'default' | 'custom' | 'none' } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, source: 'default' };
  }

  const customUrl = (localStorage.getItem(STORAGE_KEY_CUSTOM_URL) || '').trim();
  const customKey = (localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) || '').trim();

  if (customUrl && customKey) {
    return { url: customUrl, key: customKey, source: 'custom' };
  }

  return { url: '', key: '', source: 'none' };
}

export function saveCustomSupabaseCredentials(url: string, key: string): void {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (cleanUrl && cleanKey) {
    localStorage.setItem(STORAGE_KEY_CUSTOM_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_CUSTOM_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_KEY);
  }

  // Reset cached client
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Credenciais do Supabase não configuradas.' };
  }

  try {
    const { error } = await client.from('settings').select('id').limit(1);
    if (error) {
      // Se a tabela não existir, avisa para rodar o script SQL
      if (error.code === '42P01' || error.message.includes('relation "public.settings" does not exist')) {
        return {
          success: false,
          error: 'Conectou ao Supabase, mas as tabelas ainda não foram criadas! Execute o arquivo supabase-schema.sql no SQL Editor do Supabase.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro desconhecido ao testar conexão.' };
  }
}
