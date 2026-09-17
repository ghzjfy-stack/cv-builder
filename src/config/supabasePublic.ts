/** Browser-safe Supabase project URL. Row reads are limited by RLS to status fields. */
export const SUPABASE_PUBLIC_URL = "https://ywzylohuyppykhzfscnz.supabase.co";

/**
 * Public anon key (not the service role). Used only to poll order_id + status.
 * Override with VITE_SUPABASE_ANON_KEY when rotating keys.
 */
export const SUPABASE_ANON_KEY = String(
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3enlsb2h1eXBweWtoemZzY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTA2NjksImV4cCI6MjEwNDc2NjY2OX0.h1g9JtmB6QTSlbFOPIuB9frDy6YOETArEVkLtkFh3ag",
).trim();
