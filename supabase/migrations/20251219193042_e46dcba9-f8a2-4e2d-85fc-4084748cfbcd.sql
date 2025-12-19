-- Allow authenticated users to update streaming mappings (admin functionality)
CREATE POLICY "Authenticated users can update streaming mappings"
ON public.streaming_mappings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);