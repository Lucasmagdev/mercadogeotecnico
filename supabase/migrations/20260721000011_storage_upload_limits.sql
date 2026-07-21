-- Enforce file size/type limits server-side (client-side checks alone are bypassable
-- by calling the Storage API directly).
update storage.buckets
set file_size_limit = 8388608, -- 8MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'equipment-images';
