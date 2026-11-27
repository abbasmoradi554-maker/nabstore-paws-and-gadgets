-- Raise the Preview product image bucket limit to 50 MiB.
-- Keep the bucket public and retain the existing image MIME allowlist.
update storage.buckets
set file_size_limit = 52428800,
    public = true,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'product-images';
