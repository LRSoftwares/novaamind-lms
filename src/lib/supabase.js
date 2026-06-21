import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[LMS] MISSING ENV VARS:', { url: !!supabaseUrl, key: !!supabaseKey });
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root && !supabaseUrl) {
      root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:8px"><h2>Configuration Missing</h2><p style="color:#666">VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables.</p><p style="color:#999;font-size:13px">If deploying on Vercel: Settings → Environment Variables → add both keys → Redeploy</p></div>';
    }
  });
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
