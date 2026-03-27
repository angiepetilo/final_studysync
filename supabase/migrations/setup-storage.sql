-- Create the 'files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'files', 'files', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'files'
);

-- RLS Policies for the 'files' bucket

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow users to view their own files
CREATE POLICY "Allow individual read access"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to delete their own files
CREATE POLICY "Allow individual delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to update their own files
CREATE POLICY "Allow individual update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
