import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabase client (uses anon key, respects Row Level Security)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper to get the base URL for redirects.
 * Works for both development (localhost) and production.
 */
export const getRedirectURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set on Vercel.
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Ensure no trailing slash for consistency
  url = url.endsWith("/") ? url.slice(0, -1) : url;
  
  return url;
};
