-- Add from_stage column to pump table to track previous stage for undo/reopen functionality
ALTER TABLE public.pump
ADD COLUMN IF NOT EXISTS from_stage text;
