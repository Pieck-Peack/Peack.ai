import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wmhjrfkquqvpwtxsclyg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_07nEPCsGsMF2wi9l4nL-Ew_KsB8Yf-A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);