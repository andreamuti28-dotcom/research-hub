-- Restore EXECUTE on has_role so RLS policies (storage, papers, site_settings) can run for normal users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Reset demo statistics so counters reflect real usage going forward
UPDATE public.papers SET views = 0, downloads = 0;