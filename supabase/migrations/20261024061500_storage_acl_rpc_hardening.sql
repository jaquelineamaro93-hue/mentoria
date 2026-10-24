-- Security hardening 2026-10-24. No customer records are changed.
-- Explicitly deny destructive / schema-altering table actions to client roles.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
-- Anonymous clients must not mutate application tables directly.
-- Existing server-side SECURITY DEFINER flows and authenticated RLS writes remain intact.
REVOKE UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- Public 360 responses remain available through the rate-limited Next.js route,
-- which uses the service role to call these functions. Block direct Data API calls.
REVOKE ALL ON FUNCTION public.get_feedback_360_public(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_feedback_360_public(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_feedback_360_public(uuid,text,text,text,text,text,text,jsonb) TO service_role;

-- Keep all old avatar objects and public image URLs intact. Limit new uploads
-- to the same 5 MiB / image types accepted by the site's avatar endpoint.
UPDATE storage.buckets SET public=true, file_size_limit=5242880,
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
WHERE id='avatar';

-- Remove legacy permissive policies. Leave the existing public-read policy intact.
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1bs1gex_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1bs1gex_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1bs1gex_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1bs1gex_3" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1bs1gex_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1bs1gex_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1bs1gex_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1bs1gex_3" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1bs1gex_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1bs1gex_1" ON storage.objects;

CREATE POLICY avatar_owner_insert_20261024 ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id='avatar' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
);
CREATE POLICY avatar_owner_update_20261024 ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='avatar' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text)
WITH CHECK (bucket_id='avatar' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
CREATE POLICY avatar_owner_delete_20261024 ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='avatar' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
