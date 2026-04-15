-- Add missing columns to faculty table for complete profile display

-- Add status column (already in CSV but missing from schema)
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add additional profile fields that the UI expects
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_hours TEXT;

ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS office_location TEXT;

-- Comment on columns for documentation
COMMENT ON COLUMN public.faculty.status IS 'Employment status: active, inactive, on_leave, etc.';
COMMENT ON COLUMN public.faculty.bio IS 'Faculty member biography or about section';
COMMENT ON COLUMN public.faculty.office_hours IS 'Office hours schedule';
COMMENT ON COLUMN public.faculty.office_location IS 'Office location/room number';
